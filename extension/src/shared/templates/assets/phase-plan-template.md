---
plan: phase_<N>_<slug>
status: {{status}}
created: {{created}}
updated: {{updated}}
owner: lead-agent
source_phase: {{source_phase}}
---

# Phase {{phase_number}}: {{phase_title}}

## 1. Objective

{{objective}}

## 2. Relation to project end-state

{{relation}}

## 3. Entry criteria and inherited evidence

{{entry_criteria}}

## 4. Scope

{{scope}}

## 5. Non-goals

{{non_goals}}

## 6. Current-state audit

{{audit}}

## 7. Assumptions, constraints, risks, and decisions

{{assumptions}}

## 8. Dependencies

{{dependencies}}

## 9. Architecture and affected systems

{{architecture}}

## 10. Files and paths in scope

{{files}}

## 11. Supporting documents to create or update

{{supporting_docs}}

## 12. Ordered implementation tasks

{{tasks}}

## 13. Sub-agent delegation map

{{delegation}}

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
{{validation_rows}}

## 15. Security, privacy, reliability, accessibility, and performance checks

{{security}}

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
{{env_rows}}

## 17. Deferred human-action queue

| Action | Why agent cannot perform it | Earliest required phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
{{deferred_rows}}

## 18. Rollback and recovery

{{rollback}}

## 19. Acceptance criteria

{{acceptance}}

## 20. Completion evidence

{{completion}}

## 21. Deviations and follow-ups

{{deviations}}

## 22. Next Plan Generation Prompt

{{next_plan_prompt}}
