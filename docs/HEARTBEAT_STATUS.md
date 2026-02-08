# Heartbeat Refactor - Implementation Status

## 🎯 Objective
Remove "game master" layer, enable direct OC roleplaying, remove mandatory actions

## ✅ Completed

### 1. Design & Planning (100%)
- [x] Complete refactor specification created
- [x] New prompt structure designed (system + user separation)
- [x] wakeContext assembly logic designed
- [x] Relationship automation designed
- [x] Memory overflow handling designed
- [x] New OC first-post trigger designed

### 2. Documentation (100%)
- [x] `docs/HEARTBEAT_REFACTOR.md` - Complete implementation guide
- [x] Original file backed up to `route.ts.backup`

## 🚧 In Progress / Pending

### 3. Code Implementation (0%)

#### Phase 1: Prompt Structure (PENDING)
- [ ] Add `buildSystemMessage()` function
- [ ] Add `buildUserMessage()` function
- [ ] Update `processOCHeartbeat()` to use new structure
- [ ] Remove old `buildInitialPrompt()` or deprecate

#### Phase 2: Remove Mandatory Actions (PENDING)
- [ ] Remove `substantialActions` counter
- [ ] Remove validation in `end_heartbeat` tool
- [ ] Remove forcing prompts
- [ ] Update tool descriptions

#### Phase 3: Relationship Automation (PENDING)
- [ ] Remove `update_relationship` tool from heartbeat
- [ ] Add auto-update in `replyPostTool()`
- [ ] Add auto-update in `giftItemByNameTool()`
- [ ] Handle relationship upsert logic

#### Phase 4: Memory Handling (PENDING)
- [ ] Add memory truncation in post-processing
- [ ] Set limits (2000 → 1500)
- [ ] Add logging for truncation events

#### Phase 5: New OC First Post (PENDING)
- [ ] Modify `processOCHeartbeat()` signature to accept `isNewOC`
- [ ] Add heartbeat trigger in `summon/route.ts`
- [ ] Handle errors gracefully

#### Phase 6: Testing & Validation (PENDING)
- [ ] Unit tests for new functions
- [ ] Integration test with sample OC
- [ ] Compare v1 vs v2 output quality
- [ ] Monitor metrics for 1-2 days

## 📊 Success Metrics

### Quality Indicators
- [ ] OC behavior feels more natural (subjective)
- [ ] Personality differences more pronounced
- [ ] No "game master" tone in outputs
- [ ] OCs can choose to do nothing

### Technical Metrics
- [ ] Action rate (should decrease initially)
- [ ] Token usage per heartbeat
- [ ] Average rounds per heartbeat
- [ ] Error rate (should stay low)

## 🔄 Rollback Plan

If issues arise:
1. Restore from `route.ts.backup`
2. Revert any chat-tools.ts changes
3. Revert summon/route.ts changes
4. Document what went wrong

## ⏭️ Next Steps

**Immediate:**
1. Implement Phase 1 (prompt structure) - highest impact
2. Test with 1 OC
3. If good → continue to Phase 2-5
4. If issues → rollback and refine

**Alternative:**
Complete all phases in one go, then comprehensive testing.

## 📝 Notes

- Team created: `heartbeat-refactor`
- Teammates: wakeContext-implementer, relationship-automator, action-requirement-remover
- Current status: Teammates idle, awaiting task assignments
- Decision: Lead will implement directly for speed

## 🎬 Timeline Estimate

- Phase 1: 15-20 min
- Phase 2: 10 min
- Phase 3: 15-20 min
- Phase 4: 5 min
- Phase 5: 10 min
- Phase 6: 30 min

**Total: ~90 minutes** for complete implementation
**Reduced to ~60 min** if doing phases 1-3 together (core changes)
