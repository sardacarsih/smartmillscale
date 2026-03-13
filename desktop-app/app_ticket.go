package main

// Ticket printing operations

func (a *App) PrintTicket(requestJSON string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.TicketController.PrintTicket(requestJSON)
	})
}

func (a *App) GetTicketHistory(limit int, offset int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.TicketController.GetTicketHistory(limit, offset)
	})
}

func (a *App) GetTicketByNumber(ticketNumber string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.TicketController.GetTicketByNumber(ticketNumber)
	})
}

func (a *App) GetPrintStatistics(days int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.TicketController.GetPrintStatistics(days)
	})
}

func (a *App) GenerateTicketPreview(timbanganID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.TicketController.GenerateTicketPreview(timbanganID)
	})
}
