# 📞 SUPPORT ESCALATION MATRIX

**Version**: 1.0  
**Last Updated**: February 1, 2026

---

## SEVERITY DEFINITIONS

| Severity | Definition | Examples | Response SLA | Resolution Target |
|----------|------------|----------|--------------|-------------------|
| **P0** | System down, billing error, data loss | API unreachable, incorrect charge, data leakage | <1 hour | <4 hours |
| **P1** | Major feature broken, payment failure | Login broken, forecast fails, payment declined | <4 hours | <24 hours |
| **P2** | Minor feature broken, UX issue | Chart not loading, slow page, confusing UI | <24 hours | <7 days |
| **P3** | Feature request, documentation | New feature idea, docs unclear, general question | <72 hours | Best effort |

---

## AUTO-ESCALATION RULES

**Immediate P0 Escalation**:
- Any billing issue (incorrect charge, duplicate charge, failed refund)
- Any data integrity issue (cross-tenant leakage, calculation error)
- Any security issue (unauthorized access, data exposure)
- System downtime >5 minutes

**P2 → P1 Escalation**:
- Same user reports same P2 issue 3+ times
- P2 issue affects 10+ users
- P2 issue unresolved after 48 hours

**P1 → P0 Escalation**:
- P1 issue affects billing or financial data
- P1 issue unresolved after 4 hours
- P1 issue affects 50+ users

---

## ESCALATION CHAIN

### P0 - Critical
1. **On-Call Engineer** (immediate via PagerDuty)
2. **CTO** (immediate if not resolved in 15 min)
3. **CEO** (immediate if billing/data/security)

### P1 - High Priority
1. **Support Team** (email + Slack)
2. **Engineering Lead** (after 2 hours)
3. **CTO** (after 4 hours)

### P2 - Medium Priority
1. **Support Team** (email)
2. **Product Lead** (after 48 hours)

### P3 - Low Priority
1. **Support Team** (email)
2. **Product Lead** (weekly review)

---

## SUPPORT INTAKE CHANNELS

**Primary**:
- Email: support@accubooks.com
- In-app form: /support
- Emergency (P0 only): [PHONE NUMBER]

**Secondary**:
- Status page: status.accubooks.com
- Documentation: docs.accubooks.com
- Community: community.accubooks.com

---

## RESPONSE TEMPLATES

### P0 Response (Within 1 hour)
```
Subject: [P0] Issue Acknowledged - [ISSUE SUMMARY]

Hi [NAME],

We've received your report and classified this as a P0 (Critical) issue.

Issue: [DESCRIPTION]
Ticket ID: [ID]
On-call engineer: [NAME]
Status: Investigating

We are actively working on this and will update you within 30 minutes.

For urgent updates, contact: [PHONE]

The AccuBooks Team
```

### P1 Response (Within 4 hours)
```
Subject: [P1] Issue Acknowledged - [ISSUE SUMMARY]

Hi [NAME],

We've received your report and classified this as a P1 (High Priority) issue.

Issue: [DESCRIPTION]
Ticket ID: [ID]
Assigned to: [NAME]
Expected resolution: Within 24 hours

We will update you within 4 hours with progress.

The AccuBooks Team
```

### P2 Response (Within 24 hours)
```
Subject: [P2] Issue Acknowledged - [ISSUE SUMMARY]

Hi [NAME],

We've received your report and classified this as a P2 (Medium Priority) issue.

Issue: [DESCRIPTION]
Ticket ID: [ID]
Expected resolution: Within 7 days

We will update you within 48 hours with progress.

The AccuBooks Team
```

---

## BILLING ISSUE PROTOCOL

**All billing issues are P0**. Follow this protocol:

1. **Immediate Actions** (<5 minutes):
   - Acknowledge ticket
   - Notify CEO + CTO
   - Freeze billing if needed

2. **Investigation** (5-30 minutes):
   - Verify charge in Stripe
   - Check invoice accuracy
   - Identify affected users

3. **Resolution** (30-60 minutes):
   - Issue refund if incorrect
   - Fix root cause
   - Document incident

4. **Communication** (<24 hours):
   - Email user with resolution
   - Post-mortem report
   - CEO approval to resume billing

---

## CONTACT LIST

**On-Call Rotation**: PagerDuty  
**CEO**: [EMAIL] [PHONE]  
**CTO**: [EMAIL] [PHONE]  
**Support Lead**: support@accubooks.com  
**Engineering Lead**: engineering@accubooks.com  
**Product Lead**: product@accubooks.com  
**Security Team**: security@accubooks.com  
**Legal Team**: legal@accubooks.com

---

## SLA TRACKING

Track and report monthly:
- P0 response time (target: <1 hour, 100%)
- P1 response time (target: <4 hours, 95%)
- P2 response time (target: <24 hours, 90%)
- P0 resolution time (target: <4 hours, 90%)
- P1 resolution time (target: <24 hours, 80%)

**SLA Breach Protocol**:
- Notify Support Lead immediately
- Document reason for breach
- Update escalation matrix if needed
