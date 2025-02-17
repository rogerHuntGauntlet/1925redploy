# Spiky Points of View

## Purpose
This document tracks observations, questions, and points of confusion that don't fit neatly into the consensus view. It's meant to capture edge cases, unexpected behaviors, and potential areas that deserve deeper investigation.

## Current Observations

### Silent Onboarding Process
- **Observation (Jan 11, 2024)**: The onboarding process lacks visibility into system actions. While the consensus view often assumes "no news is good news" in backend operations, chat applications actually benefit from explicit progress indication and status updates.
- **Impact**: Users have no insight into account setup progress, leading to uncertainty about whether the system is working or stuck.
- **Questions**:
  - Should we treat system setup actions as "messages" in their own right?
  - Could we use the AI Feed pattern to narrate system actions during onboarding?
  - What are the key progress points users need to see during onboarding?

### Message Threading Behavior
- **Observation (Jan 11, 2024)**: The interaction between thread state and AI feed state revealed an interesting edge case. While the consensus view suggests these should be independent components, their states are actually deeply intertwined. This raises questions about whether we should treat them as truly separate components or acknowledge their coupling explicitly.
- **Impact**: This affected how we implemented the collapse/expand behavior and suggests we might need to rethink other component interactions similarly.

### Onboarding Flow
- **Observation (Jan 11, 2024)**: The redirection to onboarding during logout revealed an unexpected complexity in our auth flow. The consensus view of "logout → auth page" was too simplistic; the reality involved multiple potential redirect paths based on user state.
- **Questions**:
  - Should we maintain separate state machines for auth, onboarding, and profile completion?
  - Is the current coupling between these states intentional or accidental?

### Bro Chat Implementation
- **Observation (Jan 17, 2024)**: The implementation of a "joke" feature revealed interesting UX considerations about message transformation timing. While the consensus view might suggest transforming messages immediately for consistency, the user experience actually benefits from maintaining the illusion of natural conversation.
- **Impact**: This affected how we handle message transformations in the UI:
  - Pre-send transformation (immediately showing "Yo") felt jarring and broke immersion
  - Post-send transformation (allowing free typing, then converting to "Yo") felt more natural
- **Questions**:
  - Should we have a general pattern for handling "novelty" chat experiences?
  - How do we balance immediate feedback with maintaining the illusion of conversation?
  - When is it appropriate to transform user input versus preserving it?

### Typing Indicator Timing
- **Observation (Jan 17, 2024)**: The timing of chat interactions revealed that realistic conversation patterns require more nuanced timing than simple delays. The consensus view of "immediate typing indicator" was less effective than a staged approach (wait, then type, then respond).
- **Impact**: This suggests that even "fake" chat interactions need to follow human conversation patterns:
  - Need a delay before showing typing (simulating message reading)
  - Need appropriate typing duration (based on message length)
  - Need consistent timing patterns to maintain believability
- **Questions**:
  - Should we have a standard timing library for chat interactions?
  - How do we handle timing when network latency is also a factor?
  - Should timing patterns be configurable or hard-coded?

## Guidelines for Adding Observations

When adding new observations:

1. **Context Matters**
   - What was the expected behavior (consensus view)?
   - What actually happened?
   - Why is this interesting or important?

2. **Impact Assessment**
   - How does this affect our current implementation?
   - What assumptions does it challenge?
   - Are there similar patterns elsewhere in the codebase?

3. **Questions to Consider**
   - Is this an edge case or a fundamental misunderstanding?
   - Does this suggest a need to revise our architecture?
   - Are there similar patterns in other chat applications we should study?

## Using This Document

- Review these observations when making architectural decisions
- Use these points to identify patterns of non-obvious complexity
- Consider these cases when writing tests
- Update this document when new edge cases or unexpected behaviors emerge

## Categories to Watch

### State Management
- Unexpected state interactions
- Circular dependencies
- State synchronization issues

### User Experience
- Flows that don't match user expectations
- Inconsistencies in behavior
- Feature interactions that create confusion

### Technical Implementation
- Places where the "clean" solution doesn't work
- Performance vs. maintainability tradeoffs
- Cross-cutting concerns that don't fit our architecture

### Security and Auth
- Edge cases in authentication flow
- Permission model oddities
- Session management complexities 