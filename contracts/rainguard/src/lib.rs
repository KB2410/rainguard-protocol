#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, BytesN, Env, Bytes};
use soroban_sdk::xdr::ToXdr;

pub mod storage;
#[cfg(test)]
mod test;

use storage::{DataKey, Policy, PolicyStatus};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidSignature = 4,
    PolicyNotFound = 5,
    PolicyNotActive = 6,
    ConditionsNotMet = 7,
}

pub trait RainGuardTrait {
    fn initialize(env: Env, admin: Address, oracle_pubkey: BytesN<32>, usdc_token: Address) -> Result<(), Error>;
    fn register_policy(
        env: Env, 
        vendor: Address, 
        lat: i32, 
        lng: i32, 
        duration_days: u32, 
        tier: u32
    ) -> Result<u64, Error>;
    fn submit_weather_report(
        env: Env, 
        vendor: Address, 
        rainfall_measured: u32, 
        timestamp: u64, 
        signature: BytesN<64>
    ) -> Result<(), Error>;
    fn update_oracle(env: Env, caller: Address, new_oracle: BytesN<32>) -> Result<(), Error>;
    fn force_trigger_payout(env: Env, caller: Address, vendor: Address) -> Result<(), Error>;
}

#[contract]
pub struct RainGuardContract;

#[contractimpl]
impl RainGuardTrait for RainGuardContract {
    fn initialize(env: Env, admin: Address, oracle_pubkey: BytesN<32>, usdc_token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::OraclePubkey, &oracle_pubkey);
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
        
        Ok(())
    }

    fn register_policy(
        env: Env, 
        vendor: Address, 
        lat: i32, 
        lng: i32, 
        duration_days: u32, 
        tier: u32
    ) -> Result<u64, Error> {
        vendor.require_auth();
        
        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).ok_or(Error::NotInitialized)?;

        let (premium, payout) = match tier {
            1 => (50_000_000, 500_000_000), // Tier 1: 50 USDC -> 500 USDC (7 decimals)
            2 => (100_000_000, 1000_000_000), // Tier 2: 100 USDC -> 1000 USDC
            _ => return Err(Error::ConditionsNotMet),
        };

        let token = token::Client::new(&env, &usdc_token);
        token.transfer(&vendor, &env.current_contract_address(), &premium);

        let start_time = env.ledger().timestamp();
        let end_time = start_time + (duration_days as u64 * 24 * 60 * 60);

        let policy = Policy {
            vendor: vendor.clone(),
            latitude: lat,
            longitude: lng,
            premium_amount: premium,
            payout_amount: payout,
            start_timestamp: start_time,
            end_timestamp: end_time,
            rainfall_threshold: 1500, // 15mm scaled by 100
            status: PolicyStatus::Active,
        };

        env.storage().persistent().set(&DataKey::Policy(vendor), &policy);
        
        Ok(start_time)
    }

    fn submit_weather_report(
        env: Env, 
        vendor: Address, 
        rainfall_measured: u32, 
        timestamp: u64, 
        signature: BytesN<64>
    ) -> Result<(), Error> {
        let oracle_pubkey: BytesN<32> = env.storage().instance().get(&DataKey::OraclePubkey).ok_or(Error::NotInitialized)?;
        
        let mut policy: Policy = env.storage().persistent().get(&DataKey::Policy(vendor.clone())).ok_or(Error::PolicyNotFound)?;
        
        if policy.status != PolicyStatus::Active {
            return Err(Error::PolicyNotActive);
        }

        // Verify Ed25519 signature
        let mut payload = Bytes::new(&env);
        // Simplify payload generation for MVP
        payload.append(&vendor.clone().to_xdr(&env));
        payload.append(&policy.latitude.to_xdr(&env));
        payload.append(&policy.longitude.to_xdr(&env));
        payload.append(&rainfall_measured.to_xdr(&env));
        payload.append(&timestamp.to_xdr(&env));

        env.crypto().ed25519_verify(&oracle_pubkey, &payload, &signature);

        if rainfall_measured >= policy.rainfall_threshold {
            let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).ok_or(Error::NotInitialized)?;
            let token = token::Client::new(&env, &usdc_token);
            token.transfer(&env.current_contract_address(), &vendor, &policy.payout_amount);

            policy.status = PolicyStatus::Triggered;
            env.storage().persistent().set(&DataKey::Policy(vendor), &policy);
        }

        Ok(())
    }

    fn update_oracle(env: Env, caller: Address, new_oracle: BytesN<32>) -> Result<(), Error> {
        caller.require_auth();
        
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        
        env.storage().instance().set(&DataKey::OraclePubkey, &new_oracle);
        Ok(())
    }

    fn force_trigger_payout(env: Env, caller: Address, vendor: Address) -> Result<(), Error> {
        caller.require_auth();
        
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        if caller != admin {
            return Err(Error::Unauthorized);
        }

        let mut policy: Policy = env.storage().persistent().get(&DataKey::Policy(vendor.clone())).ok_or(Error::PolicyNotFound)?;
        if policy.status != PolicyStatus::Active {
            return Err(Error::PolicyNotActive);
        }

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).ok_or(Error::NotInitialized)?;
        let token = token::Client::new(&env, &usdc_token);
        token.transfer(&env.current_contract_address(), &vendor, &policy.payout_amount);

        policy.status = PolicyStatus::Triggered;
        env.storage().persistent().set(&DataKey::Policy(vendor), &policy);

        Ok(())
    }
}
