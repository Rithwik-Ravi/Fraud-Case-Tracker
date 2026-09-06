from typing import List, Dict, Any

DEMO_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "digital_arrest_cbi",
        "title": "1. Digital Arrest Scam (Fake CBI Video Call)",
        "flowId": "digital_arrest",
        "categoryId": "digital_arrest",
        "description": "Caller claiming to be CBI Officer Sharma on WhatsApp video call, alleging Aadhaar was used in money laundering, ordering victim to stay on call.",
        "turns": [
            {
                "user": "A police officer named Sharma video called me on WhatsApp claiming CBI found my Aadhaar card in a money laundering case and asked me to stay on camera.",
                "expectedExtracted": {
                    "suspectPhoneOrHandle": "Sharma",
                    "isDigitalArrest": True
                }
            }
        ]
    },
    {
        "id": "upi_fraud_kyc",
        "title": "2. UPI Fraud (SBI KYC Link & Collect Request)",
        "flowId": "upi_fraud",
        "categoryId": "upi_fraud",
        "description": "Phone call impersonating SBI bank officer, fake KYC link, ₹75,000 unauthorized UPI debit via GPay.",
        "turns": [
            {
                "user": "I got a call from someone pretending to be from SBI. They sent me a KYC link and I entered my details. Later ₹75,000 was debited.",
                "expectedExtracted": {
                    "fraudAmount": "75000",
                    "bankName": "State Bank of India"
                }
            },
            {
                "user": "The transaction happened yesterday afternoon via GPay.",
                "expectedExtracted": {
                    "paymentMode": "UPI"
                }
            },
            {
                "user": "My bank SMS showed UTR 418293847291 debited to taskpay@okhdfcbank.",
                "expectedExtracted": {
                    "utrNumber": "418293847291",
                    "beneficiaryAccount": "taskpay@okhdfcbank"
                }
            }
        ]
    },
    {
        "id": "job_scam_task",
        "title": "3. Work from Home / Task Scam (YouTube Likes)",
        "flowId": "job_scam",
        "categoryId": "job_scam",
        "description": "Victim joined Telegram group paying ₹50 per YouTube like, then demanded ₹40,000 deposit to unlock VIP commission.",
        "turns": [
            {
                "user": "I was offered a part time job on Telegram for liking YouTube videos. They asked me to deposit ₹40,000 into an account to unlock my earnings and now they won't release my money.",
                "expectedExtracted": {
                    "fraudAmount": "40000",
                    "socialPlatform": "Telegram"
                }
            }
        ]
    },
    {
        "id": "courier_customs_scam",
        "title": "4. Courier / Parcel Seizure Scam (FedEx Narcotics)",
        "flowId": "courier_parcel_scam",
        "categoryId": "courier_parcel_scam",
        "description": "Automated call claiming parcel from Taiwan seized with illegal MDMA, caller demands customs clearance penalty.",
        "turns": [
            {
                "user": "I received a call from FedEx saying a parcel sent in my name contains illegal drugs and customs police will arrest me unless I pay ₹50,000 penalty immediately.",
                "expectedExtracted": {
                    "fraudAmount": "50000"
                }
            }
        ]
    },
    {
        "id": "instagram_impersonation",
        "title": "5. Instagram Impersonation & Fake Profile",
        "flowId": "impersonation",
        "categoryId": "impersonation",
        "description": "Scammer cloned victim profile with handle @rahul_sharma_99 and is soliciting emergency funds from followers.",
        "turns": [
            {
                "user": "Someone made a fake Instagram profile @rahul_sharma_99 using my photos and is messaging my colleagues asking for emergency money.",
                "expectedExtracted": {
                    "socialPlatform": "Instagram",
                    "offenderHandle": "@rahul_sharma_99"
                }
            }
        ]
    },
    {
        "id": "account_hacking",
        "title": "6. Account Takeover (Gmail & 2FA Bypass)",
        "flowId": "account_takeover",
        "categoryId": "account_takeover",
        "description": "Victim's primary Gmail compromised, 2FA bypassed, recovery mobile altered.",
        "turns": [
            {
                "user": "My Gmail account was hacked last night. The hacker changed my recovery phone number and bypassed 2FA.",
                "expectedExtracted": {
                    "affectedService": "Gmail",
                    "recoveryChanged": "yes"
                }
            }
        ]
    },
    {
        "id": "ransomware_infection",
        "title": "7. Ransomware (.locked files)",
        "flowId": "malware_ransomware",
        "categoryId": "malware_ransomware",
        "description": "Accounting desktop encrypted with .locked extension and Bitcoin ransom demand.",
        "turns": [
            {
                "user": "Our company finance desktop has all files encrypted with .locked extension and there is a note demanding 0.5 Bitcoin ransom.",
                "expectedExtracted": {
                    "fileExtension": ".locked"
                }
            }
        ]
    },
    {
        "id": "sextortion_blackmail",
        "title": "8. Sextortion / Video Call Extortion",
        "flowId": "sextortion",
        "categoryId": "sextortion",
        "description": "WhatsApp video call extortion where victim was recorded and blackmailed with threat to leak video to family.",
        "turns": [
            {
                "user": "A female contacted me on WhatsApp and initiated a video call. They recorded the screen and are now threatening to send morphed private videos to my family unless I pay money.",
                "expectedExtracted": {
                    "socialPlatform": "WhatsApp"
                }
            }
        ]
    }
]
