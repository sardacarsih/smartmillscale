import React, { useEffect, useState } from 'react'
import usePKSStore from '../store/usePKSStore'
import { useWailsService } from '../../../shared/contexts/WailsContext'
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import PendingListModal from './PendingListModal'
import WeightDisplayCard from './WeightDisplayCard'
import TransactionHeaderSection from './TransactionHeaderSection'
import InlineFormField from './InlineFormField'
import TBSBlockModal from '../../../components/TBSBlockModal'
import SearchableDropdown from '../../../shared/components/SearchableDropdown'

const PKSWeighingForm = ({ currentWeight, isStable, isConnected, isMonitoring = true, currentUser, wails }) => {
  const pksService = useWailsService('pks')
  const {
    masterData,
    loadingMasterData,
    transactionForm,
    currentTransaction,
    isSubmitting,
    notification,
    showTBSBlockModal,
    updateTransactionForm,
    resetTransactionForm,
    createTimbang1,
    updateTimbang2,
    completeTransaction,
    clearNotification,
    setNotification,
    setMode,
    openTBSBlockModal,
    hideTBSBlockModal,
    setTBSBlocks
  } = usePKSStore()

  const [showTBSFields, setShowTBSFields] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  const mode = transactionForm.mode || 'timbang1'
  const isTimbang1 = mode === 'timbang1'
  const isTimbang2 = mode === 'timbang2'

  useEffect(() => {
    clearNotification()
  }, [clearNotification])

  const generateTransactionNumber = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    return `TRS-${dateStr}-${timeStr}`
  }

  useEffect(() => {
    if (!transactionForm.noTransaksi && isTimbang1) {
      updateTransactionForm('noTransaksi', generateTransactionNumber())
    }
  }, [transactionForm.noTransaksi, updateTransactionForm, isTimbang1])

  const handleProductChange = (value) => {
    updateTransactionForm('idProduk', value)
    const product = masterData?.products?.find(p => p.id.toString() === value)
    const isTBSProduct = product?.kategori === 'TBS'
    setShowTBSFields(isTBSProduct)

    // Clear conflicting fields based on product type
    if (isTBSProduct) {
      // TBS: Clear customer and legacy single-source fields.
      updateTransactionForm('idSupplier', '')
      updateTransactionForm('idEstate', '')
      updateTransactionForm('idAfdeling', '')
      updateTransactionForm('idBlok', '')
      updateTransactionForm('janjang', '')
    } else {
      // Non-TBS: Clear all TBS-specific fields
      updateTransactionForm('idEstate', '')
      updateTransactionForm('idAfdeling', '')
      updateTransactionForm('idBlok', '')
      updateTransactionForm('sumberTBS', '')
      updateTransactionForm('janjang', '')
      updateTransactionForm('grade', '')
      setTBSBlocks([])
    }
  }

  const handleTBSBlocksSubmit = (blocks) => {
    setTBSBlocks(blocks)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // STABILITY VALIDATION: Block submit jika berat belum stabil
    if (!isStable) {
      setNotification({
        type: 'warning',
        message: 'Berat belum stabil! Tunggu hingga pembacaan stabil (perlu 10 pembacaan konsisten ±0.5 kg).'
      })
      return // Block submission
    }

    // Validasi berat > 0
    if (currentWeight <= 0) {
      setNotification({
        type: 'error',
        message: 'Berat tidak valid! Pastikan ada beban di timbangan.'
      })
      return
    }

    if (isTimbang1) {
      // === Category-based validation ===
      const product = masterData?.products?.find(
        p => p.id.toString() === transactionForm.idProduk
      )
      const isTBSProduct = product?.kategori === 'TBS'

      if (isTBSProduct) {
        const hasInvalidTBSDetail = (transactionForm.tbsBlocks || []).some((item) => {
          if (!item?.idBlok) {
            return true
          }
          const janjang = Number(item.janjang)
          const brondolan = Number(item.brondolanKg ?? 0)
          return !Number.isInteger(janjang) || janjang < 0 || Number.isNaN(brondolan) || brondolan < 0
        })

        if (hasInvalidTBSDetail) {
          setNotification({
            type: 'error',
            message: 'Detail blok TBS tidak valid. Pastikan setiap blok memiliki janjang valid dan brondolan tidak negatif.'
          })
          return
        }
      } else {
        if (!transactionForm.idSupplier) {
          setNotification({
            type: 'error',
            message: 'Customer wajib diisi untuk produk non-TBS'
          })
          return
        }
      }

      // Timbang1 logic
      updateTransactionForm('bruto', currentWeight / 100)
      const success = await createTimbang1(pksService, currentUser.id)
      if (success) {
        resetTransactionForm()
        setShowTBSFields(false)
      }
    } else {
      // Timbang2 logic
      updateTransactionForm('bruto2', currentWeight / 100)
      const success = await updateTimbang2(pksService, currentUser.id)
      if (success) {
        setShowCompletion(true)
      }
    }
  }

  const handleOpenPendingList = () => {
    setShowPendingModal(true)
  }

  const handleSelectTransaction = (transaction) => {
    setMode('timbang2')
    setShowPendingModal(false)
    setShowCompletion(false)
  }

  const handleCompleteTransaction = async () => {
    const success = await completeTransaction(pksService, currentUser.id)
    if (success) {
      setShowCompletion(false)
      setShowTBSFields(false)
      // Store will auto-reset to Timbang1 mode after 2 seconds
    }
  }

  const handleBackToTimbang1 = () => {
    resetTransactionForm()
    setShowCompletion(false)
    setShowTBSFields(false)
  }

  return (
    <>
      <div className="rounded-xl bg-gray-800 shadow-xl">
        {/* Header with mode indicator and back button */}
        {isTimbang2 && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToTimbang1}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Kembali ke Timbang 1"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-3xl">🌴</span>
              Timbang 2 - PKS
            </h2>
          </div>
        )}

        {/* Transaction Summary (Timbang2 mode only) */}
        {isTimbang2 && currentTransaction && (
          <div className="mb-6 rounded-xl bg-gray-900 p-4">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Informasi Transaksi</h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-400">No. Transaksi:</span>
                <span className="ml-2 text-white font-medium">{currentTransaction.noTransaksi}</span>
              </div>
              <div>
                <span className="text-gray-400">Supir:</span>
                <span className="ml-2 text-white font-medium">{currentTransaction.driverName}</span>
              </div>
              <div>
                <span className="text-gray-400">Kendaraan:</span>
                <span className="ml-2 text-white font-medium">{currentTransaction.unit?.nomor_polisi || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400">Produk:</span>
                <span className="ml-2 text-white font-medium">{currentTransaction.produk?.nama_produk || '-'}</span>
              </div>
            </div>

            {/* Timbang 1 Data */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-md font-medium text-gray-300 mb-2">Data Timbang 1</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div>
                  <span className="text-gray-400">Bruto:</span>
                  <span className="ml-2 text-white font-medium">{currentTransaction.bruto} kg</span>
                </div>
                <div>
                  <span className="text-gray-400">Tara:</span>
                  <span className="ml-2 text-white font-medium">{currentTransaction.tara} kg</span>
                </div>
                <div>
                  <span className="text-gray-400">Netto:</span>
                  <span className="ml-2 text-white font-medium">{currentTransaction.netto} kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success'
            ? 'bg-green-900/20 border border-green-900/50 text-green-400'
            : 'bg-red-900/20 border border-red-900/50 text-red-400'
            }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {notification.message}
          </div>
        )}

        {!showCompletion ? (
          <>
            {/* Weight Display with consolidated status */}
            <div className="mb-6">
              <WeightDisplayCard
                currentWeight={currentWeight}
                isStable={isStable}
                isConnected={isConnected}
                isMonitoring={isMonitoring}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isTimbang1 ? (
                <>
                  {/* TIMBANG 1 FIELDS */}
                  {/* Transaction Number with Pending List button */}
                  <TransactionHeaderSection
                    transactionNumber={transactionForm.noTransaksi}
                    onTransactionNumberChange={(value) => updateTransactionForm('noTransaksi', value)}
                    onOpenPendingList={handleOpenPendingList}
                    isSubmitting={isSubmitting}
                    mode={mode}
                  />

                  {/* Product */}
                  <InlineFormField label="Produk" required>
                    <SearchableDropdown
                      options={masterData?.products || []}
                      value={transactionForm.idProduk}
                      onChange={handleProductChange}
                      placeholder="Pilih Produk"
                      getOptionLabel={(product) => `${product.kode_produk} - ${product.nama_produk}`}
                      getOptionValue={(product) => product.id}
                      disabled={isSubmitting}
                      required
                      isLoading={loadingMasterData}
                      noOptionsMessage="Tidak ada data produk. Periksa master data."
                    />
                  </InlineFormField>

                  {/* Unit & Driver Name - Same Row */}
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {/* Unit */}
                    <InlineFormField label="Unit/Kendaraan" required>
                      <SearchableDropdown
                        options={masterData?.units || []}
                        value={transactionForm.idUnit}
                        onChange={(value) => updateTransactionForm('idUnit', value)}
                        placeholder="Pilih Unit"
                        getOptionLabel={(unit) => `${unit.nomor_polisi} - ${unit.nama_kendaraan}`}
                        getOptionValue={(unit) => unit.id}
                        disabled={isSubmitting}
                        required
                        isLoading={loadingMasterData}
                        noOptionsMessage="Tidak ada data unit. Periksa master data."
                      />
                    </InlineFormField>

                    {/* Driver Name */}
                    <InlineFormField label="Nama Supir" required>
                      <input
                        type="text"
                        value={transactionForm.driverName}
                        onChange={(e) => updateTransactionForm('driverName', e.target.value)}
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                        disabled={isSubmitting}
                        required
                      />
                    </InlineFormField>
                  </div>

                  {/* CONDITIONAL: Supplier for non-TBS, optional block-detail flow for TBS */}
                  {showTBSFields ? (
                    // === TBS Product: Detail blok jadi sumber utama (opsional) ===
                    <div className="space-y-4 border border-green-900/30 rounded-lg p-4 bg-green-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🌴</span>
                        <h3 className="text-md font-medium text-gray-300">
                          Detail Blok TBS (Opsional)
                        </h3>
                      </div>

                      <p className="text-sm text-green-400/80 italic flex items-center gap-1">
                        <span>💡</span>
                        <span>Pilih blok langsung dari master blok. Estate/Afdeling akan diturunkan otomatis dari blok yang dipilih.</span>
                      </p>
                    </div>
                  ) : (
                    // === Non-TBS Product: Show Customer (original behavior) ===
                    <InlineFormField label="Customer" required>
                      <SearchableDropdown
                        options={masterData?.suppliers || []}
                        value={transactionForm.idSupplier}
                        onChange={(value) => updateTransactionForm('idSupplier', value)}
                        placeholder="Pilih Customer"
                        getOptionLabel={(supplier) => `${supplier.kode_supplier} - ${supplier.nama_supplier}`}
                        getOptionValue={(supplier) => supplier.id}
                        disabled={isSubmitting}
                        required
                        isLoading={loadingMasterData}
                        noOptionsMessage="Tidak ada data customer"
                      />
                    </InlineFormField>
                  )}

                  {/* TBS Additional Fields (only for TBS products) */}
                  {showTBSFields && (
                    <div className="border-t border-gray-700 pt-4 space-y-4">
                      <h3 className="text-lg font-medium text-gray-300">Data Tambahan TBS</h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* Grade */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Grade
                          </label>
                          <select
                            value={transactionForm.grade || ''}
                            onChange={(e) => updateTransactionForm('grade', e.target.value)}
                            className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                            disabled={isSubmitting}
                          >
                            <option value="">Pilih Grade</option>
                            <option value="A">Grade A</option>
                            <option value="B">Grade B</option>
                            <option value="C">Grade C</option>
                            <option value="D">Grade D</option>
                          </select>
                        </div>

                        {/* Sumber TBS */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sumber TBS
                          </label>
                          <input
                            type="text"
                            value={transactionForm.sumberTBS || ''}
                            onChange={(e) => updateTransactionForm('sumberTBS', e.target.value)}
                            placeholder="Sumber"
                            className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* TBS Block Data Button */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={openTBSBlockModal}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          disabled={isSubmitting}
                        >
                          Input Data per Blok TBS
                        </button>
                        {transactionForm.tbsBlocks && transactionForm.tbsBlocks.length > 0 && (
                          <>
                            <div className="mt-2 text-sm text-gray-300">
                              Data blok TBS telah diinput ({transactionForm.tbsBlocks.length} blok)
                            </div>
                            <div className="mt-3 overflow-x-auto">
                              <table className="min-w-full text-xs text-gray-300 border border-gray-700 rounded">
                                <thead className="bg-gray-800">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Blok</th>
                                    <th className="px-3 py-2 text-left">Estate</th>
                                    <th className="px-3 py-2 text-left">Afdeling</th>
                                    <th className="px-3 py-2 text-right">Janjang</th>
                                    <th className="px-3 py-2 text-right">Brondolan (kg)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transactionForm.tbsBlocks.map((block, idx) => (
                                    <tr key={`${block.idBlok}-${idx}`} className="border-t border-gray-700">
                                      <td className="px-3 py-2">{`${block.kodeBlok || '-'} - ${block.namaBlok || '-'}`}</td>
                                      <td className="px-3 py-2">{block.namaEstate || '-'}</td>
                                      <td className="px-3 py-2">{block.namaAfdeling || '-'}</td>
                                      <td className="px-3 py-2 text-right">{block.janjang}</td>
                                      <td className="px-3 py-2 text-right">{Number(block.brondolanKg || 0).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weight Information */}
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Informasi Berat</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {/* Timbang1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Timbang1 *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.bruto}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 cursor-not-allowed"
                          required
                        />
                      </div>

                      {/* Timbang2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Timbang2
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.tara}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 cursor-not-allowed"
                        />
                      </div>

                      {/* Netto (calculated) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Netto (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.netto}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-600 text-gray-300 border border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* TIMBANG 2 FIELDS */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Informasi Berat Timbang 2</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* Bruto 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bruto 2 (kg) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.bruto2 || ''}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 cursor-not-allowed"
                          required
                        />
                      </div>

                      {/* Tara 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tara 2 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.tara2 || ''}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 cursor-not-allowed"
                        />
                      </div>

                      {/* Netto 2 (calculated) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Netto 2 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.netto2 || ''}
                          readOnly
                          className="w-full px-4 py-2 rounded bg-gray-600 text-gray-300 border border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected || !isStable || currentWeight <= 0}
                className={`w-full py-3 rounded-lg font-semibold text-lg transition-all ${isSubmitting || !isConnected || !isStable || currentWeight <= 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : isTimbang1
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isTimbang1 ? 'Mencatat Timbang 1...' : 'Memperbarui Timbang 2...'}
                  </span>
                ) : !isStable ? (
                  '⏳ Menunggu Pembacaan Stabil...'
                ) : currentWeight <= 0 ? (
                  '⚠️ Tidak Ada Beban'
                ) : (
                  isTimbang1 ? 'Catat Timbang 1' : 'Update Timbang 2'
                )}
              </button>
            </form>

            {/* Warnings */}
            {!isStable && isConnected && (
              <div className="mt-4 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-900/50 rounded p-3">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Timbangan belum stabil. Menunggu 10 pembacaan konsisten (±0.5 kg). Tombol submit akan aktif otomatis saat stabil.
              </div>
            )}

            {!isConnected && (
              <div className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded p-3">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Timbangan tidak terhubung. Periksa koneksi timbangan.
              </div>
            )}
          </>
        ) : (
          /* Completion Section */
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h3 className="text-xl font-semibold text-green-400">Timbang 2 Berhasil Diperbarui!</h3>
              </div>

              {/* Weight Comparison */}
              <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Timbang 1</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bruto:</span>
                      <span className="text-white">{currentTransaction.bruto} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tara:</span>
                      <span className="text-white">{currentTransaction.tara} kg</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-400">Netto:</span>
                      <span className="text-white">{currentTransaction.netto} kg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Timbang 2</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bruto:</span>
                      <span className="text-white">{transactionForm.bruto2} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tara:</span>
                      <span className="text-white">{transactionForm.tara2 || 0} kg</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-400">Netto:</span>
                      <span className="text-white">{transactionForm.netto2} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Difference Calculation */}
              {transactionForm.netto2 !== currentTransaction.netto && (
                <div className="bg-gray-800 rounded p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Selisih Netto</h4>
                  <div className="text-lg font-semibold">
                    <span className={`${transactionForm.netto2 > currentTransaction.netto ? 'text-green-400' : 'text-red-400'}`}>
                      {transactionForm.netto2 > currentTransaction.netto ? '+' : ''}
                      {(transactionForm.netto2 - currentTransaction.netto).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 xl:flex-row">
              <button
                onClick={() => setShowCompletion(false)}
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Periksa Kembali
              </button>
              <button
                onClick={handleCompleteTransaction}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyelesaikan...
                  </span>
                ) : (
                  'Selesaikan Transaksi'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending List Modal */}
      {showPendingModal && (
        <PendingListModal
          onClose={() => setShowPendingModal(false)}
          onSelectTransaction={handleSelectTransaction}
          currentUser={currentUser}
        />
      )}

      {/* TBS Block Modal */}
      <TBSBlockModal
        isOpen={showTBSBlockModal}
        onClose={hideTBSBlockModal}
        onSubmit={handleTBSBlocksSubmit}
        blocks={transactionForm.tbsBlocks}
        masterBlocks={masterData?.blocks || []}
      />
    </>
  )
}

export default PKSWeighingForm
