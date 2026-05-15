// src/licence.rs
//
// R2P Licence — Lemon Squeezy only.
//
// Open Source version: Used for Plugin verification only.
// Main app tier is always Community in this build.

#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};

const LS_ACTIVATE_URL:   &str = "https://api.lemonsqueezy.com/v1/licenses/activate";
const LS_VALIDATE_URL:   &str = "https://api.lemonsqueezy.com/v1/licenses/validate";
const LS_DEACTIVATE_URL: &str = "https://api.lemonsqueezy.com/v1/licenses/deactivate";

fn token_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("growthvariable")
        .join("RepoToPitch")
        .join("licence.json")

}



#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    Community,
    Desktop,
    Pro,
}

impl Tier {
    pub fn deep_dive_bundled(&self) -> bool {
        matches!(self, Tier::Pro)
    }

    pub fn report_brand_price(&self) -> u32 {
        match self {
            Tier::Pro       => 99,
            Tier::Desktop   => 149,
            Tier::Community => 199,
        }
    }

    pub fn plugins_enabled(&self) -> bool {
        !matches!(self, Tier::Community)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenceToken {
    pub licence_key:  String,
    pub instance_id:  String,
    pub tier:         Tier,
    pub product_name: String,
    pub user_name:    String,
    pub user_email:   String,
    pub activated_at: DateTime<Utc>,
    pub last_checked: DateTime<Utc>,
}

impl LicenceToken {
    pub fn save(&self) -> Result<(), LicenceError> {
        let path = token_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| LicenceError::Io(e.to_string()))?;
        }
        let json = serde_json::to_string_pretty(self).map_err(|e| LicenceError::Io(e.to_string()))?;
        std::fs::write(&path, json).map_err(|e| LicenceError::Io(e.to_string()))?;
        Ok(())
    }

    pub fn load() -> Result<Self, LicenceError> {
        let path = token_path();
        let json = std::fs::read_to_string(&path).map_err(|_| LicenceError::NoToken)?;
        serde_json::from_str(&json).map_err(|_| LicenceError::InvalidToken)
    }

    pub fn delete() -> Result<(), LicenceError> {
        let path = token_path();
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| LicenceError::Io(e.to_string()))?;
        }
        Ok(())
    }

    pub fn needs_remote_check(&self) -> bool {
        let age = Utc::now() - self.last_checked;
        age.num_days() >= 7
    }
}

#[derive(Debug)]
pub enum LicenceError {
    NoToken,
    InvalidToken,
    InvalidKey,
    KeyAlreadyActivated,
    KeyExpired,
    NetworkError(String),
    Io(String),
}

impl std::fmt::Display for LicenceError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LicenceError::NoToken             => write!(f, "No licence found."),
            LicenceError::InvalidToken        => write!(f, "Licence file invalid."),
            LicenceError::InvalidKey          => write!(f, "Licence key not recognised."),
            LicenceError::KeyAlreadyActivated => write!(f, "Key already active on another machine."),
            LicenceError::KeyExpired          => write!(f, "Licence key expired."),
            LicenceError::NetworkError(msg)   => write!(f, "Network error: {}", msg),
            LicenceError::Io(msg)             => write!(f, "IO error: {}", msg),
        }
    }
}

#[derive(Deserialize)]
struct LsActivateResponse {
    activated:  bool,
    instance:   Option<LsInstance>,
    meta:       Option<LsMeta>,
    error:      Option<String>,
}

#[derive(Deserialize)]
struct LsInstance {
    id: String,
}

#[derive(Deserialize)]
struct LsMeta {
    variant_id:     Option<u64>,
    variant_name:   Option<String>,
    customer_name:  Option<String>,
    customer_email: Option<String>,
}

#[derive(Deserialize)]
struct LsValidateResponse {
    valid:  bool,
    #[allow(dead_code)]
    error:  Option<String>,
}

pub async fn activate(licence_key: &str) -> Result<LicenceToken, LicenceError> {
    let client = reqwest::Client::new();
    let response = client
        .post(LS_ACTIVATE_URL)
        .form(&[
            ("license_key", licence_key),
            ("instance_name", "r2p-desktop"),
        ])
        .send()
        .await
        .map_err(|e| LicenceError::NetworkError(e.to_string()))?;

    let ls: LsActivateResponse = response.json().await.map_err(|e| LicenceError::NetworkError(e.to_string()))?;

    if !ls.activated {
        let msg = ls.error.unwrap_or_default();
        return Err(if msg.contains("already") {
            LicenceError::KeyAlreadyActivated
        } else if msg.contains("expired") {
            LicenceError::KeyExpired
        } else {
            LicenceError::InvalidKey
        });
    }

    let instance_id = ls.instance.map(|i| i.id).unwrap_or_default();
    let meta = ls.meta.unwrap_or(LsMeta { 
        variant_id: None, 
        variant_name: None,
        customer_name: None,
        customer_email: None
    });

    let tier = match meta.variant_id {
        Some(1628712) | Some(1595271) => Tier::Pro,
        _ => Tier::Desktop,
    };

    let token = LicenceToken {
        licence_key:  licence_key.to_string(),
        instance_id,
        tier,
        product_name: meta.variant_name.unwrap_or_else(|| "Desktop Edition".into()),
        user_name:    meta.customer_name.unwrap_or_else(|| "User".into()),
        user_email:   meta.customer_email.unwrap_or_else(|| "".into()),
        activated_at: Utc::now(),
        last_checked: Utc::now(),
    };

    token.save()?;
    Ok(token)
}

pub fn load_local() -> Result<LicenceToken, LicenceError> {
    LicenceToken::load()
}

pub async fn validate_remote(token: &mut LicenceToken) -> Result<(), LicenceError> {
    let client = reqwest::Client::new();
    let response = client
        .post(LS_VALIDATE_URL)
        .form(&[
            ("license_key", token.licence_key.as_str()),
            ("instance_id", token.instance_id.as_str()),
        ])
        .send()
        .await
        .map_err(|e| LicenceError::NetworkError(e.to_string()))?;

    let ls: LsValidateResponse = response.json().await.map_err(|e| LicenceError::NetworkError(e.to_string()))?;

    if !ls.valid {
        let _ = LicenceToken::delete();
        return Err(LicenceError::InvalidKey);
    }

    token.last_checked = Utc::now();
    token.save()?;
    Ok(())
}

pub async fn deactivate(token: &LicenceToken) -> Result<(), LicenceError> {
    let client = reqwest::Client::new();
    let _ = client
        .post(LS_DEACTIVATE_URL)
        .form(&[
            ("license_key", token.licence_key.as_str()),
            ("instance_id", token.instance_id.as_str()),
        ])
        .send()
        .await;

    LicenceToken::delete()
}
