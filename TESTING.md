# Testing Instruction Report

This document describes how to execute and present **unit**, **integration**, and **performance** testing for PowerSense, with emphasis on the Energy module contribution.

## Testing Objectives
- Validate business logic correctness in isolation
- Validate API route behavior and auth requirements
- Validate service responsiveness under load

## Test Environment
| Item | Value |
|------|-------|
| OS | Windows |
| Runtime | Node.js |
| Backend Test Framework | Jest |
| API Integration Utility | Supertest |
| Performance Tool | Artillery |

---

## 1. Unit Testing

### Scope
- Controller logic
- Validation behavior
- Error-path handling
- User-scoped logic

### Commands
Run all backend unit tests:
```bash
cd BACKEND
npm run test:unit
```

Run only Energy module unit tests:
```bash
npm test -- tests/unit/energyAnalytics.controller.test.js tests/unit/energyConsumption.controller.test.js
```

### Energy Module Unit Test Files
- `tests/unit/energyAnalytics.controller.test.js`
- `tests/unit/energyConsumption.controller.test.js`

---

## 2. Integration Testing

### Scope
- Route-level request/response contracts
- Authentication and authorization behavior
- Endpoint orchestration from route to controller

### Commands
Run all backend integration tests:
```bash
cd BACKEND
npm run test:integration
```

Run only Energy module integration test:
```bash
npm test -- tests/integration/energyAnalytics.routes.test.js
```

### Energy Module Integration Test File
- `tests/integration/energyAnalytics.routes.test.js`

---

## 3. Performance Testing

### Tooling
Artillery load profile is configured for backend endpoint validation under concurrent request load.

### Scenario File
- `BACKEND/tests/performance/energy-analytics-load-test.yml`

### Command
```bash
cd BACKEND
npx artillery run tests/performance/energy-analytics-load-test.yml
```

### Performance Metrics to Report
- Average response time
- 95th percentile latency
- Error percentage
- Requests per second (throughput)

---

## Evidence Collection for Evaluation
Capture the following for submission/viva:
1. Terminal output for unit test pass summary
2. Terminal output for integration test pass summary
3. Artillery summary output (latency + error stats)
4. Date/time and command used for each run

---

## Known Constraint and Mitigation
In some environments, `mongodb-memory-server` can fail due binary download/checksum/network restrictions. To keep testing deterministic, Energy module coverage is implemented with route/controller-focused test strategy using mocks where appropriate.

