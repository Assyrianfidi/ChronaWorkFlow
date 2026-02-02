# 📢 INCIDENT COMMUNICATION TEMPLATE

**Version**: 1.0  
**Last Updated**: February 1, 2026

---

## COMMUNICATION PRINCIPLES

1. **Never hide outages** - Transparency builds trust
2. **Never blame users** - Focus on system issues
3. **Never minimize** - Accurate impact reporting
4. **Communicate proactively** - Update before users report

---

## INCIDENT START (Within 5 minutes)

### Status Page Update
```
🔴 [COMPONENT] - Investigating

We are investigating reports of [ISSUE DESCRIPTION].

Impact: [DESCRIPTION OF USER IMPACT]
Started: [TIMESTAMP UTC]

We will provide an update within 15 minutes.
```

### Email (If P0)
```
Subject: [AccuBooks] Service Issue - Investigating

Hi,

We are currently investigating an issue affecting [COMPONENT].

What's happening: [DESCRIPTION]
Impact: [USER IMPACT]
Status: Investigating

We will send an update within 15 minutes.

For real-time updates: status.accubooks.com

The AccuBooks Team
```

---

## INCIDENT UPDATE (Every 30 minutes)

### Status Page Update
```
🟡 [COMPONENT] - Identified

We have identified the issue as [ROOT CAUSE DESCRIPTION].

Impact: [CURRENT USER IMPACT]
Started: [TIMESTAMP UTC]
Duration: [MINUTES] so far

We are working on a fix and expect resolution within [TIMEFRAME].

Next update: [TIMESTAMP]
```

### Email (If P0 and >30 minutes)
```
Subject: [AccuBooks] Service Issue - Update

Hi,

Update on the ongoing service issue:

Root cause: [DESCRIPTION]
Current status: [STATUS]
Expected resolution: [TIMEFRAME]

We apologize for the inconvenience and are working to resolve this as quickly as possible.

For real-time updates: status.accubooks.com

The AccuBooks Team
```

---

## INCIDENT RESOLVED

### Status Page Update
```
🟢 [COMPONENT] - Resolved

The issue has been resolved. All systems are now operational.

Issue: [DESCRIPTION]
Root cause: [ROOT CAUSE]
Duration: [TOTAL MINUTES]
Started: [START TIME UTC]
Resolved: [END TIME UTC]

We apologize for any inconvenience this may have caused.
```

### Email (If P0)
```
Subject: [AccuBooks] Service Issue - Resolved

Hi,

The service issue affecting [COMPONENT] has been resolved.

Issue: [DESCRIPTION]
Root cause: [ROOT CAUSE]
Duration: [TOTAL MINUTES]
Resolution: [WHAT WAS DONE]

All systems are now operating normally.

We sincerely apologize for any inconvenience this may have caused. If you experienced any issues, please contact support@accubooks.com.

The AccuBooks Team
```

---

## BILLING INCIDENT (P0 - Special Template)

### Immediate Email to Affected Users
```
Subject: IMPORTANT: Billing Issue Resolved

Dear [NAME],

We are writing to inform you of a billing issue that affected your account.

What happened: [DESCRIPTION]
Your account: [SPECIFIC IMPACT]
Action taken: [REFUND/CORRECTION DETAILS]

We have:
1. [ACTION 1 - e.g., Issued full refund of $X.XX]
2. [ACTION 2 - e.g., Fixed the underlying issue]
3. [ACTION 3 - e.g., Verified no other charges affected]

Timeline:
- Issue occurred: [TIMESTAMP]
- Issue detected: [TIMESTAMP]
- Issue resolved: [TIMESTAMP]
- Refund processed: [TIMESTAMP]

The refund will appear in your account within 5-7 business days.

We sincerely apologize for this error. Billing accuracy is our highest priority, and we have implemented additional safeguards to prevent this from happening again.

If you have any questions or concerns, please contact us immediately:
- Email: billing@accubooks.com
- Phone: [EMERGENCY NUMBER]

The AccuBooks Team
```

---

## DATA INCIDENT (P0 - Special Template)

### Immediate Email to Affected Users
```
Subject: URGENT: Data Security Notification

Dear [NAME],

We are writing to inform you of a data security incident that may have affected your account.

What happened: [DESCRIPTION]
When it occurred: [TIMESTAMP]
When we detected it: [TIMESTAMP]
What data was affected: [SPECIFIC DATA TYPES]

What we've done:
1. [ACTION 1 - e.g., Immediately secured the system]
2. [ACTION 2 - e.g., Conducted full security audit]
3. [ACTION 3 - e.g., Notified relevant authorities]

What you should do:
1. [USER ACTION 1 - if applicable]
2. [USER ACTION 2 - if applicable]

We take data security extremely seriously and are conducting a comprehensive investigation.

For questions or concerns:
- Email: security@accubooks.com
- Phone: [EMERGENCY NUMBER]

We will provide updates as our investigation continues.

The AccuBooks Team
```

---

## SCHEDULED MAINTENANCE

### Email (48 hours before)
```
Subject: [AccuBooks] Scheduled Maintenance - [DATE]

Hi,

We will be performing scheduled maintenance on [DATE] at [TIME UTC].

Duration: [ESTIMATED MINUTES]
Affected services: [COMPONENTS]
Expected impact: [DESCRIPTION]

During this time, [DESCRIPTION OF USER IMPACT].

We recommend:
- [RECOMMENDATION 1]
- [RECOMMENDATION 2]

For updates during maintenance: status.accubooks.com

Thank you for your patience.

The AccuBooks Team
```

### Status Page (7 days before)
```
📅 Scheduled Maintenance

Date: [DATE] [TIME UTC]
Duration: [ESTIMATED MINUTES]
Affected: [COMPONENTS]

Description: [WHAT WILL BE DONE]

Impact: [USER IMPACT DESCRIPTION]
```

---

## POST-INCIDENT REPORT (Within 48 hours)

### Email to All Users (If P0 >30 minutes)
```
Subject: [AccuBooks] Incident Report - [DATE]

Hi,

We want to provide you with details about the service incident that occurred on [DATE].

Summary:
- Issue: [DESCRIPTION]
- Duration: [TOTAL MINUTES]
- Impact: [USER IMPACT]
- Root cause: [TECHNICAL DESCRIPTION]

Timeline:
- [TIME]: Issue began
- [TIME]: Issue detected
- [TIME]: Root cause identified
- [TIME]: Fix deployed
- [TIME]: Service restored

What we're doing to prevent this:
1. [PREVENTION MEASURE 1]
2. [PREVENTION MEASURE 2]
3. [PREVENTION MEASURE 3]

We sincerely apologize for the disruption. We are committed to providing reliable service and have taken steps to ensure this doesn't happen again.

Full incident report: [LINK]

The AccuBooks Team
```

---

## COMMUNICATION CHANNELS

**Status Page**: status.accubooks.com (primary)  
**Email**: All users (P0 incidents)  
**In-App Banner**: Active incidents  
**Twitter**: @AccuBooks (major incidents)  
**Slack**: #incidents (internal)

---

## APPROVAL REQUIREMENTS

**Status Page Updates**: On-call engineer (immediate)  
**Email to Users**: Support Lead approval (P1/P2), CEO approval (P0)  
**Post-Incident Report**: CTO approval (all P0/P1)  
**Data/Billing Incidents**: CEO + Legal approval (always)
