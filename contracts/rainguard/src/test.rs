#![cfg(test)]
use super::*;
use soroban_sdk::{Env, testutils::Address as _};

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RainGuardContract);
    let client = RainGuardContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let oracle_pubkey = BytesN::from_array(&env, &[0; 32]);
    let usdc_token = Address::generate(&env);

    client.initialize(&admin, &oracle_pubkey, &usdc_token);
}
