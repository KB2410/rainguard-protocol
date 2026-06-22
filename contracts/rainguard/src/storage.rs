use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PolicyStatus {
    Active,
    Triggered,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub vendor: Address,
    pub latitude: i32,          // Scaled by 10,000 to eliminate floating points
    pub longitude: i32,         // Scaled by 10,000 to eliminate floating points
    pub premium_amount: i128,   // Specified in atomic units of USDC (stroops)
    pub payout_amount: i128,    // Specified in atomic units of USDC (stroops)
    pub start_timestamp: u64,
    pub end_timestamp: u64,
    pub rainfall_threshold: u32,// Precipitation trigger in mm (scaled by 100)
    pub status: PolicyStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    OraclePubkey,
    UsdcToken,
    Policy(Address),            // Maps unique vendor address to their policy state
}
