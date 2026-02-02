# 📊 STATUS PAGE SPECIFICATION

**Version**: 1.0  
**Last Updated**: February 1, 2026  
**URL**: status.accubooks.com

---

## COMPONENTS

### 1. API Service
**Status**: Operational / Degraded / Down  
**Metric**: HTTP 200 response from `/api/monitoring/health`  
**Check Frequency**: Every 60 seconds  
**Degraded**: Response time >2s OR error rate >0.5%  
**Down**: No response for 3 consecutive checks

### 2. Database
**Status**: Operational / Degraded / Down  
**Metric**: Database connection pool health  
**Check Frequency**: Every 60 seconds  
**Degraded**: Pool utilization >80% OR query latency >500ms  
**Down**: No database connectivity

### 3. Forecasting Engine
**Status**: Operational / Degraded / Down  
**Metric**: Forecast queue processing  
**Check Frequency**: Every 60 seconds  
**Degraded**: Queue depth >100 OR job failure rate >5%  
**Down**: Queue not processing for 5 minutes

### 4. Billing System
**Status**: Operational / Degraded / Down  
**Metric**: Stripe API connectivity  
**Check Frequency**: Every 60 seconds  
**Degraded**: Stripe API latency >2s  
**Down**: Stripe API unreachable OR billing frozen

---

## UPTIME CALCULATION

**Target**: 99.5% uptime (43.8 hours downtime/year)  
**Calculation**: (Total time - Downtime) / Total time × 100  
**Reporting Period**: Last 90 days  
**Display**: Daily, weekly, monthly uptime percentages

---

## INCIDENT HISTORY

**Display**: Last 90 days  
**Format**:
```
[DATE] [TIME] - [COMPONENT] - [STATUS]
[DURATION] - [DESCRIPTION]
```

**Example**:
```
Feb 1, 2026 14:32 UTC - API Service - Down
Duration: 12 minutes
Description: Database connection pool exhaustion. Resolved by restarting application.
```

---

## MAINTENANCE WINDOWS

**Scheduled Maintenance**:
- Display 7 days in advance
- Include start time, duration, affected components
- Send email notification 48 hours before

**Format**:
```
[DATE] [TIME] - Scheduled Maintenance
Duration: [MINUTES]
Affected: [COMPONENTS]
Description: [DESCRIPTION]
```

---

## SUBSCRIPTION NOTIFICATIONS

**Email Notifications**:
- Incident start (all subscribers)
- Incident updates (every 30 minutes)
- Incident resolved (all subscribers)
- Scheduled maintenance (48 hours before)

**Webhook Notifications**:
- JSON payload with incident details
- Sent to configured webhook URL
- Includes component, status, timestamp

---

## STATUS PAGE UPDATES

**Incident Start** (Within 5 minutes):
```
🔴 [COMPONENT] - Investigating

We are investigating reports of [ISSUE]. We will provide an update within 15 minutes.

Posted: [TIMESTAMP]
```

**Incident Update** (Every 30 minutes):
```
🟡 [COMPONENT] - Identified

We have identified the issue as [DESCRIPTION]. We are working on a fix.

Posted: [TIMESTAMP]
```

**Incident Resolved**:
```
🟢 [COMPONENT] - Resolved

The issue has been resolved. All systems are operational.

Duration: [MINUTES]
Root cause: [DESCRIPTION]

Posted: [TIMESTAMP]
```

---

## IMPLEMENTATION

**Technology**: Statuspage.io OR custom implementation  
**Hosting**: Separate infrastructure (not on main app servers)  
**Monitoring**: External monitoring service (Pingdom, UptimeRobot)  
**Automation**: Auto-update from Prometheus alerts

---

## TRANSPARENCY POLICY

**Never hide outages**: All incidents >5 minutes must be posted  
**Never blame users**: Incident descriptions focus on system issues  
**Never minimize**: Accurate duration and impact reporting  
**Proactive communication**: Update before users report issues
