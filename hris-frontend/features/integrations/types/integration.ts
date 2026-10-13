export interface IntegrationConnector {
  id: string;
  name: string;
  vendor: string;
  category: string;
  protocol: string;
  status: "ONLINE" | "ERROR" | "DEGRADED" | "MOCK_MODE";
  mode: "MOCK_SIMULATOR" | "LIVE_SANDBOX";
  lastSyncAt: string | null;
  totalSyncedRecords: number;
  description: string;
}

export interface IntegrationSyncLog {
  id: string;
  connectorId: string;
  connectorName: string;
  operation: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "SUCCESS" | "FAILED" | "WARNING";
  httpStatusCode: number;
  endpointUrl: string;
  requestPayload: string;
  responsePayload: string;
  durationMs: number;
  recordsCount: number;
  message: string;
  timestamp: string;
}

export interface CoupaExpenseLine {
  lineNumber: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
}

export interface CoupaExpenseReport {
  id: string;
  reportNumber: string;
  title: string;
  employeeEmail: string;
  employeeName: string;
  totalAmount: number;
  currency: string;
  status: string;
  approvedDate: string;
  lines: CoupaExpenseLine[];
}
