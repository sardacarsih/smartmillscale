package main

// PKS Master Data operations

func (a *App) CreateProduct(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateProduct(requestJSON, creatorID)
	})
}

func (a *App) UpdateProduct(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateProduct(requestJSON, updaterID)
	})
}

func (a *App) DeleteProduct(productID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteProduct(productID, deleterID)
	})
}

func (a *App) GetProducts(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetProducts(activeOnly)
	})
}

func (a *App) CreateUnit(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateUnit(requestJSON, creatorID)
	})
}

func (a *App) UpdateUnit(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateUnit(requestJSON, updaterID)
	})
}

func (a *App) DeleteUnit(unitID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteUnit(unitID, deleterID)
	})
}

func (a *App) GetUnits(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetUnits(activeOnly)
	})
}

func (a *App) CreateSupplier(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateSupplier(requestJSON, creatorID)
	})
}

func (a *App) UpdateSupplier(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateSupplier(requestJSON, updaterID)
	})
}

func (a *App) DeleteSupplier(supplierID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteSupplier(supplierID, deleterID)
	})
}

func (a *App) GetSuppliers(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetSuppliers(activeOnly)
	})
}

func (a *App) CreateEstate(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateEstate(requestJSON, creatorID)
	})
}

func (a *App) UpdateEstate(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateEstate(requestJSON, updaterID)
	})
}

func (a *App) DeleteEstate(estateID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteEstate(estateID, deleterID)
	})
}

func (a *App) GetEstates(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetEstates(activeOnly)
	})
}

func (a *App) CreateAfdeling(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateAfdeling(requestJSON, creatorID)
	})
}

func (a *App) UpdateAfdeling(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateAfdeling(requestJSON, updaterID)
	})
}

func (a *App) DeleteAfdeling(afdelingID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteAfdeling(afdelingID, deleterID)
	})
}

func (a *App) GetAfdelings(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetAfdelings(activeOnly)
	})
}

func (a *App) GetAfdelingsByEstate(estateID string, activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetAfdelingsByEstate(estateID, activeOnly)
	})
}

func (a *App) CreateBlok(requestJSON string, creatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.CreateBlok(requestJSON, creatorID)
	})
}

func (a *App) UpdateBlok(requestJSON string, updaterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.UpdateBlok(requestJSON, updaterID)
	})
}

func (a *App) DeleteBlok(blokID string, deleterID string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.PKSMasterController.DeleteBlok(blokID, deleterID)
	})
}

func (a *App) GetBlokByAfdeling(afdelingID string, activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetBlokByAfdeling(afdelingID, activeOnly)
	})
}

func (a *App) GetBlok(activeOnly bool) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSMasterController.GetBlok(activeOnly)
	})
}
