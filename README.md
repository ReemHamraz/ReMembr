<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MemoRay — Real-Time Memory Augmentation for Dementia Care

MemoRay is an AI-powered cognitive assistant designed to support dementia patients by helping them recognize visitors in real time through Meta Ray-Ban smart glasses or any compatible camera device. When someone enters the patient's room, MemoRay identifies them, displays who they are, recalls the last interaction, and alerts caregivers about unknown or unsafe visitors — all while keeping every byte of data stored securely on-device.

MemoRay combines Google Gemini Vision, Flash, Pro, and Nano to create a context-aware safety system that enhances dignity, independence, and human connection for vulnerable individuals.

---

## Features

### 1. Real-Time Visitor Recognition
- Identifies people using on-device facial recognition  
- Displays:
  - Visitor name  
  - Relationship to the patient  
  - Last interaction summary (powered by Gemini Pro)

### 2. Unknown Visitor Alerts
- If the system cannot match the face, it shows a soft "Unknown Visitor" alert  
- Helps reduce confusion and supports patient safety

### 3. Blacklist Detection (Safety Mode)
- Caregivers can add individuals to a restricted or blacklist group  
- When detected, the system shows a red safety alert

### 4. Privacy by Design
All sensitive data — images, embeddings, visitor logs — stays entirely on the user’s device.  
- No cloud uploads  
- No external servers  
- No third-party processing  
- Full local encryption  

Processing uses:  
- Gemini Nano for on-device inference  
- Local encrypted storage  
- Caregiver-controlled access

### 5. Last-Interaction Memory Support
Gemini Pro generates a brief summary of the last interaction with the visitor.  
Example:  
“Sarah last visited two days ago. She brought flowers and spent 30 minutes reading with you.”

### 6. AR Overlay Experience
Designed for Meta Ray-Ban glasses but works with any camera feed.  
Displays real-time, non-intrusive labels near the visitor’s face.

### 7. Caregiver Dashboard (Prototype)
Caregivers can:  
- Upload and manage visitor photos  
- Add relationships and notes  
- Add restricted individuals  
- View logs locally on-device  

---

## How It Works

1. Caregiver uploads known visitor images  
   - Images are stored locally with encrypted embeddings

2. A visitor enters the room  
   - The glasses capture their face  
   - Gemini Vision, Flash, and Nano identify them on-device

3. MemoRay displays:  
   - Name  
   - Relationship  
   - Last interaction summary  

4. If the visitor is unknown  
   - A soft “Unknown Visitor” alert is shown  

5. If the visitor is blacklisted  
   - A discreet red safety alert is triggered  

---

## Tech Stack

### AI and Processing
- Google Gemini Vision  
- Gemini Flash  
- Gemini Pro  
- Gemini Nano (for full on-device inference)

### Hardware
- Meta Ray-Ban Smart Glasses (optional)  
- Smartphone or laptop webcam (for demo)

### Frontend
- React / Flutter / Web prototype

### Storage
- Local SQLite or device storage  
- Encrypted facial embeddings  

---

## Why MemoRay?

Dementia affects over 55 million people worldwide. One of the most distressing symptoms is the inability to recognize familiar faces. MemoRay supports memory rather than replacing it.

- Helps patients feel safe and connected  
- Reduces caregiver stress  
- Prevents unsafe interactions  
- Provides discreet, dignity-preserving assistance  

This is assistive AI designed with humanity in mind.

---

## Demo Flow

1. Visitor enters the camera frame  
2. AR overlay appears showing:
   - Name  
   - Relationship  
   - Last interaction  
3. Unknown visitor triggers a soft alert  
4. Blacklisted visitor triggers a safety alert  
5. Caregiver dashboard interaction

---

## Future Roadmap

- Emotion and tone detection  
- Voice-based memory prompts  
- Multi-caregiver management  
- Hospital system integration  
- Long-term cognitive trend tracking  
- Memory reinforcement exercises  

---

## Built For

Google Gemini Hackathon 2025  
Category: Assistive AI / Healthcare / AR and Wearables

---

## Dedicated to dementia patients, caregivers, and families.

