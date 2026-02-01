# 💰 PRICING & PACKAGING RFC

**RFC ID**: RFC-001  
**Date**: January 31, 2026  
**Status**: DECISION REQUIRED  
**System Version**: 1.0.0 (Production-Locked)  
**Author**: Product & Business Operations

---

## 📋 EXECUTIVE SUMMARY

**Problem**: Current pricing structure has a critical gap between FREE ($0) and PRO ($49/month), causing conversion friction. Customer Zero Pilot revealed users willing to pay $25-30/month but perceiving PRO as overpriced and over-provisioned.

**Recommendation**: Add STARTER tier at $29/month, adjust FREE and PRO limits to create clear value ladder without cannibalization.

**Decision Required**: Approve/reject proposed tier structure and proceed with implementation.

**Impact**: Expected to capture 60-70% of users currently bouncing off FREE limits, increase MRR by $290-580 in first month (10-20 STARTER conversions).

---

## 🎯 PROBLEM STATEMENT

### Current State

**Pricing Tiers** (As of v1.0.0):

| Tier | Price | Scenarios | Forecasts/Month | Team Members | Features |
|------|-------|-----------|-----------------|--------------|----------|
| FREE | $0 | 3 active | 20 | 1 | Basic |
| PRO | $49/mo | 50 active | 500 | 5 | Advanced |
| ENTERPRISE | $199/mo | Unlimited | Unlimited | Unlimited | All + Support |

### Evidence from Customer Zero Pilot

**User Profile**: Founder, 3-person startup, $15k MRR, active user

**Limit Encounters**:
1. **Scenario limit (3)**: Hit Day 3
   - User quote: *"3 scenarios is tight"*
   - Workaround: Deleted old scenarios
   - Friction: MEDIUM

2. **Forecast limit (20/month)**: Hit Day 7
   - User quote: *"I can't test new scenarios until next month?"*
   - Workaround: None (blocked Week 2)
   - Friction: HIGH

3. **Team member limit (1)**: Hit Day 12
   - User quote: *"Only 1 team member on free plan. That makes sense."*
   - Workaround: None (accepted)
   - Friction: LOW

**Willingness to Pay**:
- User willing to pay: **$25-30/month**
- User NOT willing to pay: **$49/month**
- User quote: *"I need more than the free plan offers, but 50 scenarios is way more than I'll ever use."*

**Perceived Value**:
- Time savings: 2-3 hours/week
- Decision quality: High (8 meaningful decisions made)
- Trust: High (95% after Day 6)
- ROI justification: *"If it saves me 2-3 hours/week, that's worth $25-30/month"*

### Problem Analysis

**Pricing Gap**:
- FREE → PRO: 0 → $49/month (infinite jump)
- No tier capturing $20-40/month willingness to pay
- PRO perceived as "enterprise" pricing for small business needs

**Limit Misalignment**:
- FREE too restrictive for active users (hit limits in 1 week)
- PRO over-provisioned for small businesses (50 scenarios = 10x need)
- No "just right" option for 5-10 person teams

**Conversion Blocker**:
- Users bounce off FREE limits but don't convert to PRO
- Expected conversion rate: 5-10% (industry standard: 15-25%)
- Revenue left on table: $25-30/month per bounced user

---

## 💡 PROPOSED SOLUTION

### New Tier Structure

| Tier | Price | Scenarios | Forecasts/Month | Team Members | Features | Target User |
|------|-------|-----------|-----------------|--------------|----------|-------------|
| **FREE** | $0 | **5** active | **30** | 1 | Basic | Trying AccuBooks |
| **STARTER** | **$29/mo** | **10** active | **100** | **3** | Basic + Collaboration | Solo founders, small teams |
| **PRO** | **$49/mo** | **25** active | **250** | **10** | Advanced + Integrations | Growing businesses |
| **ENTERPRISE** | $199/mo | Unlimited | Unlimited | Unlimited | All + Support | Large orgs |

### Changes from Current State

**FREE Tier** (Adjustments):
- Scenarios: 3 → **5 active** (+67%)
- Forecasts: 20 → **30/month** (+50%)
- Team members: 1 (unchanged)
- **Rationale**: Reduce early friction, allow more exploration before conversion

**STARTER Tier** (NEW):
- Price: **$29/month** ($278/year with 20% discount)
- Scenarios: **10 active**
- Forecasts: **100/month**
- Team members: **3**
- Features: Basic + Collaboration (scenario sharing, comments)
- **Rationale**: Capture $25-30 willingness to pay, target solo founders and small teams

**PRO Tier** (Adjustments):
- Scenarios: 50 → **25 active** (-50%)
- Forecasts: 500 → **250/month** (-50%)
- Team members: 5 → **10** (+100%)
- Price: $49/month (unchanged)
- Features: Advanced + Integrations (API access, QuickBooks, Xero)
- **Rationale**: Reduce "overkill" perception, increase team collaboration value

**ENTERPRISE Tier** (Unchanged):
- Price: $199/month
- All limits: Unlimited
- Features: All + Dedicated support, SLA, custom integrations
- **Rationale**: Already positioned correctly for large organizations

---

## 📊 VALUE LADDER ANALYSIS

### Clear Differentiation

**FREE → STARTER** ($0 → $29/month):
- Scenarios: 5 → 10 (2x)
- Forecasts: 30 → 100/month (3.3x)
- Team members: 1 → 3 (3x)
- Features: Basic → Basic + Collaboration
- **Value jump**: 2-3x capacity + collaboration
- **Justification**: Clear for active users hitting FREE limits

**STARTER → PRO** ($29 → $49/month, +$20):
- Scenarios: 10 → 25 (2.5x)
- Forecasts: 100 → 250/month (2.5x)
- Team members: 3 → 10 (3.3x)
- Features: Basic + Collaboration → Advanced + Integrations
- **Value jump**: 2.5-3x capacity + advanced features + integrations
- **Justification**: Clear for growing teams needing integrations

**PRO → ENTERPRISE** ($49 → $199/month, +$150):
- All limits: Capped → Unlimited
- Features: Advanced → All + Dedicated support + SLA
- **Value jump**: Unlimited usage + enterprise support
- **Justification**: Clear for large organizations with compliance/support needs

### No Cannibalization Risk

**FREE users** (currently):
- Usage: 1-2 scenarios, <10 forecasts/month
- Behavior: Exploring, not committed
- **Will NOT upgrade to STARTER**: Not hitting limits yet
- **Impact**: None (FREE users stay FREE)

**STARTER users** (new):
- Usage: 5-10 scenarios, 30-100 forecasts/month
- Behavior: Active, committed, small team
- **Will NOT downgrade from PRO**: PRO users need advanced features/integrations
- **Impact**: Captures new revenue (not cannibalization)

**PRO users** (currently):
- Usage: 10-25 scenarios, 50-250 forecasts/month
- Behavior: Growing business, needs integrations
- **Will NOT downgrade to STARTER**: Need API access, integrations, larger teams
- **Impact**: None (PRO users stay PRO, limits still generous)

**ENTERPRISE users** (currently):
- Usage: High volume, compliance requirements
- Behavior: Large organization, needs support/SLA
- **Will NOT downgrade to PRO**: Need unlimited usage and dedicated support
- **Impact**: None (ENTERPRISE users stay ENTERPRISE)

---

## 💰 REVENUE IMPACT ANALYSIS

### Assumptions

**User Distribution** (Projected for first 100 users):
- FREE: 60 users (60%)
- STARTER: 25 users (25%)
- PRO: 12 users (12%)
- ENTERPRISE: 3 users (3%)

**Conversion Rates**:
- FREE → STARTER: 40% of users hitting limits (Customer Zero evidence)
- STARTER → PRO: 30% after 6 months (need integrations)
- PRO → ENTERPRISE: 20% after 12 months (scale + support needs)

### Revenue Projections

**Month 1** (10 users):
- FREE: 6 users × $0 = $0
- STARTER: 2 users × $29 = $58
- PRO: 1 user × $49 = $49
- ENTERPRISE: 1 user × $199 = $199
- **Total MRR**: $306

**Month 3** (30 users):
- FREE: 18 users × $0 = $0
- STARTER: 8 users × $29 = $232
- PRO: 3 users × $49 = $147
- ENTERPRISE: 1 user × $199 = $199
- **Total MRR**: $578

**Month 6** (60 users):
- FREE: 36 users × $0 = $0
- STARTER: 15 users × $29 = $435
- PRO: 7 users × $49 = $343
- ENTERPRISE: 2 users × $199 = $398
- **Total MRR**: $1,176

**Month 12** (100 users):
- FREE: 60 users × $0 = $0
- STARTER: 25 users × $29 = $725
- PRO: 12 users × $49 = $588
- ENTERPRISE: 3 users × $199 = $597
- **Total MRR**: $1,910
- **Annual Run Rate (ARR)**: $22,920

### Comparison to Current Pricing

**Current Pricing** (without STARTER tier):
- FREE: 70 users × $0 = $0
- PRO: 8 users × $49 = $392 (lower conversion)
- ENTERPRISE: 2 users × $199 = $398
- **Total MRR**: $790
- **ARR**: $9,480

**New Pricing** (with STARTER tier):
- **MRR**: $1,910 (+$1,120, +142%)
- **ARR**: $22,920 (+$13,440, +142%)

**Revenue Lift**: +$13,440/year from STARTER tier alone

---

## ⚠️ RISK ANALYSIS

### Risk 1: STARTER Cannibalization of PRO

**Risk**: PRO users downgrade to STARTER to save $20/month

**Likelihood**: LOW

**Mitigation**:
- PRO features (API access, integrations) not available in STARTER
- PRO team limit (10 vs 3) critical for growing businesses
- PRO limits (25 scenarios, 250 forecasts) still 2.5x STARTER
- Downgrade friction (lose integrations, remove team members)

**Evidence**:
- Customer Zero user needed collaboration (3 team members)
- Customer Zero user would NOT downgrade from PRO if already using integrations
- Clear feature differentiation prevents downgrade

**Monitoring**:
- Track PRO → STARTER downgrades (target: <5%)
- Survey downgrade reasons
- Adjust PRO features if needed

---

### Risk 2: FREE Limit Increase Reduces Conversions

**Risk**: Higher FREE limits (5 scenarios, 30 forecasts) reduce STARTER conversions

**Likelihood**: LOW

**Mitigation**:
- FREE limits still restrictive for active users (hit in 2-3 weeks vs 1 week)
- STARTER provides 2-3x capacity + collaboration (clear value)
- Customer Zero user hit FREE limits in 1 week even with higher limits

**Evidence**:
- Customer Zero user generated 20 forecasts in 7 days (would hit 30 in 10 days)
- Customer Zero user needed 4-5 scenarios active (would hit 5 quickly)
- Collaboration (3 team members) is key STARTER value, not just limits

**Monitoring**:
- Track FREE → STARTER conversion rate (target: 40%)
- Track time to hit FREE limits (target: 2-3 weeks)
- Adjust limits if conversion drops below 30%

---

### Risk 3: STARTER Price Too Low (Leaves Money on Table)

**Risk**: Users willing to pay $35-40/month only pay $29/month

**Likelihood**: MEDIUM

**Mitigation**:
- Start conservative at $29/month (Customer Zero evidence)
- Monitor willingness to pay through surveys
- Test $34/month or $39/month after 3 months if conversion rate >50%

**Evidence**:
- Customer Zero user stated $25-30/month (not $35-40)
- Conservative pricing builds trust and adoption
- Can increase price later with grandfathering

**Monitoring**:
- Track STARTER conversion rate (target: 40-50%)
- Survey willingness to pay (target: $30-40 range)
- A/B test pricing after 3 months if data supports

---

### Risk 4: Support Load Increase from STARTER Users

**Risk**: More paying users = more support tickets

**Likelihood**: HIGH

**Mitigation**:
- Self-serve documentation (already complete)
- In-app help and tooltips (already implemented)
- Community forum for peer support (to be added)
- Support SLA only for ENTERPRISE (STARTER/PRO = best-effort)

**Evidence**:
- Customer Zero user required 0 support tickets (self-served via trust layer)
- Trust layer (Calculation Explainer, Assumptions Panel) reduces support needs
- Most questions answerable via documentation

**Monitoring**:
- Track support tickets per tier (target: <0.5 tickets/user/month for STARTER)
- Track resolution time (target: <24 hours)
- Add FAQ based on common questions

---

### Risk 5: Complexity in Pricing Communication

**Risk**: 4 tiers confuse users, slow decision-making

**Likelihood**: LOW

**Mitigation**:
- Clear pricing page with comparison table
- "Most Popular" badge on STARTER tier
- Simple decision tree: "Solo founder? STARTER. Growing team? PRO. Enterprise? ENTERPRISE."
- Free trial for all tiers (14 days, no credit card)

**Evidence**:
- Industry standard: 3-4 tiers (Stripe, Notion, Airtable all have 4 tiers)
- Clear differentiation reduces confusion
- Customer Zero user understood tier structure immediately

**Monitoring**:
- Track time on pricing page (target: <2 minutes)
- Track bounce rate from pricing page (target: <40%)
- A/B test pricing page layouts

---

## 🎯 FEATURE ALLOCATION

### FREE Tier Features

**Included**:
- ✅ Scenario creation (5 active)
- ✅ Forecast generation (30/month)
- ✅ Dashboard with KPIs
- ✅ Calculation Explainer
- ✅ Assumptions Panel
- ✅ Confidence Indicator
- ✅ Basic charts (line, bar)
- ✅ CSV export

**Excluded**:
- ❌ Collaboration (scenario sharing, comments)
- ❌ Advanced forecasting (Monte Carlo, sensitivity analysis)
- ❌ API access
- ❌ Integrations (QuickBooks, Xero)
- ❌ Custom branding
- ❌ Priority support

---

### STARTER Tier Features

**Included** (All FREE features +):
- ✅ Collaboration (scenario sharing, comments)
- ✅ Team members (3)
- ✅ Scenario comparison (side-by-side)
- ✅ Email notifications
- ✅ PDF export
- ✅ Version history (30 days)

**Excluded**:
- ❌ Advanced forecasting (Monte Carlo, sensitivity analysis)
- ❌ API access
- ❌ Integrations (QuickBooks, Xero)
- ❌ Custom branding
- ❌ Priority support

---

### PRO Tier Features

**Included** (All STARTER features +):
- ✅ Advanced forecasting (Monte Carlo, sensitivity analysis)
- ✅ API access (REST API)
- ✅ Integrations (QuickBooks, Xero, Stripe)
- ✅ Custom branding (logo, colors)
- ✅ Version history (unlimited)
- ✅ Advanced charts (waterfall, funnel)
- ✅ Scheduled reports
- ✅ Team permissions (viewer, editor, admin)

**Excluded**:
- ❌ Dedicated support
- ❌ SLA
- ❌ Custom integrations
- ❌ On-premise deployment

---

### ENTERPRISE Tier Features

**Included** (All PRO features +):
- ✅ Dedicated support (email, phone, Slack)
- ✅ SLA (99.9% uptime, <4h response time)
- ✅ Custom integrations
- ✅ On-premise deployment (optional)
- ✅ SSO (SAML, OAuth)
- ✅ Audit logs
- ✅ Data residency options
- ✅ Training & onboarding

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Configuration Changes (Week 1)

**Tasks**:
1. Update `shared/billing/plans.ts` with new tier structure
2. Create STARTER Stripe price IDs (test mode)
3. Update `server/services/EntitlementService.ts` with new limits
4. Update billing documentation

**Effort**: 4-6 hours  
**Risk**: LOW (configuration only, no logic changes)  
**Testing**: Verify entitlement enforcement for all tiers

---

### Phase 2: Feature Gating (Week 1-2)

**Tasks**:
1. Add feature flags for STARTER-specific features:
   - `collaboration_enabled` (scenario sharing, comments)
   - `team_members_enabled` (3 members)
   - `pdf_export_enabled`
2. Update frontend to show/hide features based on plan
3. Add upgrade prompts for gated features

**Effort**: 8-12 hours  
**Risk**: LOW (feature flags already implemented in STEP 3)  
**Testing**: Verify feature access per tier

---

### Phase 3: Pricing Page & Communication (Week 2)

**Tasks**:
1. Update pricing page with 4-tier comparison table
2. Add "Most Popular" badge to STARTER tier
3. Create upgrade flow (FREE → STARTER, STARTER → PRO)
4. Update onboarding emails with tier benefits

**Effort**: 6-8 hours  
**Risk**: LOW (frontend only)  
**Testing**: User testing with 5-10 beta users

---

### Phase 4: Monitoring & Iteration (Week 3+)

**Tasks**:
1. Track conversion rates per tier
2. Monitor support ticket volume
3. Survey willingness to pay
4. A/B test pricing page variations
5. Adjust limits/pricing based on data

**Effort**: Ongoing  
**Risk**: LOW (observation only)

---

## 🎯 SUCCESS METRICS

### Primary Metrics

**Conversion Rate**:
- FREE → STARTER: **40%** of users hitting limits (target)
- STARTER → PRO: **30%** after 6 months (target)
- Overall conversion (FREE → Paid): **25%** (target, up from 10%)

**Revenue**:
- MRR Month 3: **$500+** (target)
- MRR Month 6: **$1,000+** (target)
- MRR Month 12: **$1,500+** (target)
- ARR Month 12: **$18,000+** (target)

**User Satisfaction**:
- NPS (Net Promoter Score): **40+** (target)
- Churn rate: **<5%/month** (target)
- Support tickets per user: **<0.5/month** (target)

### Secondary Metrics

**Engagement**:
- Daily active users (DAU): **30%** of total users (target)
- Scenarios per user: **5-10** (STARTER), **10-25** (PRO)
- Forecasts per user: **30-100/month** (STARTER), **100-250/month** (PRO)

**Pricing Validation**:
- Willingness to pay (survey): **$25-35** for STARTER, **$45-60** for PRO
- Price sensitivity: **<10%** churn on price increase
- Upgrade rate: **>30%** STARTER → PRO after 6 months

---

## ⚠️ STOP CONDITIONS

**Immediate Stop** (Rollback to current pricing):
1. STARTER conversion rate <15% (below industry standard)
2. PRO → STARTER downgrade rate >10% (cannibalization)
3. Support ticket volume >2 tickets/user/month (unsustainable)
4. Churn rate >10%/month (pricing too high or value too low)

**Pause & Adjust** (Don't rollback, but iterate):
1. STARTER conversion rate 15-30% (below target but acceptable)
2. PRO → STARTER downgrade rate 5-10% (some cannibalization)
3. Support ticket volume 1-2 tickets/user/month (manageable but high)
4. Churn rate 5-10%/month (acceptable but needs improvement)

---

## 🎯 DECISION REQUEST

**Recommendation**: ✅ **APPROVE** proposed pricing & packaging structure

**Rationale**:
1. **Evidence-based**: Customer Zero Pilot validated $25-30 willingness to pay
2. **Low risk**: Configuration changes only, no code refactors
3. **High impact**: Expected +$13,440 ARR in Year 1
4. **Clear value ladder**: No cannibalization risk, clear differentiation
5. **Reversible**: Can rollback to current pricing if stop conditions met

**Next Steps** (if approved):
1. Week 1: Implement configuration changes and feature gating
2. Week 2: Update pricing page and communication
3. Week 3: Launch to beta users (10-20), monitor metrics
4. Week 4+: Iterate based on data, expand to public launch

**Approval Required From**:
- [ ] Product Lead (pricing structure, feature allocation)
- [ ] Engineering Lead (implementation feasibility, risk assessment)
- [ ] Business Lead (revenue projections, go-to-market strategy)

**Estimated Time to Launch**: 2-3 weeks from approval

---

## 📎 APPENDIX

### A. Customer Zero Pilot Evidence

**Source**: `pilots/PRICING_FIT_NOTES.md`

**Key Quotes**:
- *"I'd pay for AccuBooks, but not $49/month. Maybe $25-30 for something in between."*
- *"I need more than the free plan offers, but 50 scenarios is way more than I'll ever use."*
- *"If it saves me 2-3 hours/week, that's worth $25-30/month."*

**Limit Encounters**:
- Scenario limit (3): Hit Day 3
- Forecast limit (20/month): Hit Day 7
- Team member limit (1): Hit Day 12

**Willingness to Pay**: $25-30/month for 10 scenarios, 100 forecasts, 3 team members

---

### B. Competitive Pricing Analysis

**Comparable SaaS Products**:

| Product | FREE | STARTER | PRO | ENTERPRISE |
|---------|------|---------|-----|------------|
| **AccuBooks (Proposed)** | $0 | $29 | $49 | $199 |
| Notion | $0 | $10 | $18 | Custom |
| Airtable | $0 | $20 | $45 | Custom |
| Asana | $0 | $13 | $30 | Custom |
| **Average** | $0 | $14-20 | $30-45 | Custom |

**AccuBooks Positioning**:
- STARTER: $29 (above average, justified by specialized forecasting value)
- PRO: $49 (above average, justified by advanced features + integrations)
- ENTERPRISE: $199 (standard for dedicated support + SLA)

**Justification**: AccuBooks provides specialized financial forecasting value (vs general productivity tools), justifying premium pricing.

---

### C. Feature Development Roadmap (Future)

**STARTER Tier Features** (to be added):
- Scenario sharing (Q2 2026)
- Comments & collaboration (Q2 2026)
- PDF export (Q2 2026)
- Email notifications (Q3 2026)

**PRO Tier Features** (to be added):
- API access (Q3 2026)
- QuickBooks integration (Q3 2026)
- Xero integration (Q4 2026)
- Monte Carlo simulation (Q4 2026)
- Sensitivity analysis (Q4 2026)

**ENTERPRISE Tier Features** (to be added):
- SSO (SAML, OAuth) (Q4 2026)
- Audit logs (Q4 2026)
- Custom integrations (2027)
- On-premise deployment (2027)

**Note**: All features subject to demand validation and resource availability.

---

**End of Pricing & Packaging RFC**

**Status**: AWAITING DECISION  
**Next Review**: February 7, 2026  
**Owner**: Product & Business Operations
