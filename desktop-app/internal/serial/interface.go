package serial

// SerialReaderInterface defines the interface for serial port readers
type SerialReaderInterface interface {
	Start() error
	Stop() error
	IsConnected() bool
	GetDataChannel() <-chan WeightData
	GetErrorChannel() <-chan error
	GetReconnectChannel() <-chan struct{} // Notifies when reconnection occurs
}
