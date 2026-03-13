package main

// Audit log operations

// GetRecentAuditLogs returns recent audit logs with pagination
// Returns a tuple of [logs, total] as a JSON array
func (a *App) GetRecentAuditLogs(limit int, offset int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		logs, total, err := a.application.Container.AuthService.GetAuditLogs(limit, offset)
		if err != nil {
			return nil, err
		}
		// Return as an array tuple [logs, total] to match frontend expectations
		return []interface{}{logs, total}, nil
	})
}
