import React, { useEffect, useMemo, useState } from 'react'
import SearchableDropdown from '../shared/components/SearchableDropdown'

const newRow = () => ({
  idBlok: '',
  janjang: '',
  brondolanKg: ''
})

const toStringID = (value) => (value === null || value === undefined ? '' : String(value))

const TBSBlockModal = ({ isOpen, onClose, onSubmit, blocks = [], masterBlocks = [] }) => {
  const [rows, setRows] = useState([])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (Array.isArray(blocks) && blocks.length > 0) {
      setRows(
        blocks.map((item) => ({
          idBlok: toStringID(item.idBlok),
          janjang: item.janjang === 0 ? '0' : (item.janjang ? String(item.janjang) : ''),
          brondolanKg: item.brondolanKg === 0 ? '0' : (item.brondolanKg ? String(item.brondolanKg) : '')
        }))
      )
    } else {
      setRows([])
    }
    setFormError('')
  }, [isOpen, blocks])

  const selectedBlockIDs = useMemo(() => new Set(rows.map((row) => row.idBlok).filter(Boolean)), [rows])

  const getBlockByID = (blockID) => {
    if (!blockID) {
      return null
    }
    return masterBlocks.find((block) => String(block.id) === String(blockID)) || null
  }

  const getEstateName = (block) => block?.afdeling?.estate?.nama_estate || '-'
  const getAfdelingName = (block) => block?.afdeling?.nama_afdeling || '-'

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
    setFormError('')
  }

  const addRow = () => {
    setRows((prev) => [...prev, newRow()])
    setFormError('')
  }

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
    setFormError('')
  }

  const handleSave = (event) => {
    event.preventDefault()

    if (rows.length === 0) {
      onSubmit([])
      onClose()
      return
    }

    const seen = new Set()
    const normalized = []

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const rowNumber = i + 1

      if (!row.idBlok) {
        setFormError(`Baris ${rowNumber}: pilih blok terlebih dahulu.`)
        return
      }

      const blockID = parseInt(row.idBlok, 10)
      if (!Number.isInteger(blockID) || blockID <= 0) {
        setFormError(`Baris ${rowNumber}: blok tidak valid.`)
        return
      }

      if (seen.has(blockID)) {
        setFormError(`Baris ${rowNumber}: blok duplikat tidak diperbolehkan.`)
        return
      }
      seen.add(blockID)

      if (row.janjang === '' || row.janjang === null || row.janjang === undefined) {
        setFormError(`Baris ${rowNumber}: janjang wajib diisi.`)
        return
      }

      const janjang = parseInt(row.janjang, 10)
      if (!Number.isInteger(janjang) || janjang < 0) {
        setFormError(`Baris ${rowNumber}: janjang harus bilangan bulat >= 0.`)
        return
      }

      const brondolanRaw = row.brondolanKg === '' ? '0' : row.brondolanKg
      const brondolanKg = parseFloat(brondolanRaw)
      if (Number.isNaN(brondolanKg) || brondolanKg < 0) {
        setFormError(`Baris ${rowNumber}: brondolan harus angka >= 0.`)
        return
      }

      const block = getBlockByID(blockID)
      if (!block) {
        setFormError(`Baris ${rowNumber}: blok tidak ditemukan di master blok.`)
        return
      }

      normalized.push({
        idBlok: blockID,
        kodeBlok: block.kode_blok,
        namaBlok: block.nama_blok,
        idEstate: block.afdeling?.id_estate || null,
        namaEstate: getEstateName(block),
        idAfdeling: block.id_afdeling,
        namaAfdeling: getAfdelingName(block),
        janjang,
        brondolanKg
      })
    }

    onSubmit(normalized)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Detail Blok TBS</h2>
            <p className="mt-1 text-sm text-gray-400">
              Pilih blok dari master blok, isi janjang per blok, dan opsional brondolan (kg).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="px-3 py-2 text-left">Blok *</th>
                  <th className="px-3 py-2 text-left">Estate</th>
                  <th className="px-3 py-2 text-left">Afdeling</th>
                  <th className="px-3 py-2 text-left">Janjang *</th>
                  <th className="px-3 py-2 text-left">Brondolan (kg)</th>
                  <th className="px-3 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      Belum ada detail blok. Tambahkan baris jika ingin mengisi detail.
                    </td>
                  </tr>
                )}

                {rows.map((row, index) => {
                  const selectedBlock = getBlockByID(row.idBlok)
                  const availableOptions = masterBlocks.filter((block) => {
                    const blockID = String(block.id)
                    return blockID === row.idBlok || !selectedBlockIDs.has(blockID)
                  })

                  return (
                    <tr key={`${index}-${row.idBlok || 'new'}`} className="border-b border-gray-800 align-top">
                      <td className="px-3 py-2 min-w-[300px]">
                        <SearchableDropdown
                          options={availableOptions}
                          value={row.idBlok}
                          onChange={(value) => updateRow(index, 'idBlok', toStringID(value))}
                          placeholder="Pilih Blok"
                          getOptionLabel={(block) => `${block.kode_blok} - ${block.nama_blok}`}
                          getOptionValue={(block) => toStringID(block.id)}
                          noOptionsMessage="Tidak ada blok tersedia"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-300">{getEstateName(selectedBlock)}</td>
                      <td className="px-3 py-3 text-gray-300">{getAfdelingName(selectedBlock)}</td>
                      <td className="px-3 py-2 min-w-[140px]">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.janjang}
                          onChange={(event) => updateRow(index, 'janjang', event.target.value)}
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 min-w-[180px]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.brondolanKg}
                          onChange={(event) => updateRow(index, 'brondolanKg', event.target.value)}
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="rounded bg-red-900/40 px-3 py-2 text-xs text-red-300 hover:bg-red-900/60"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {formError && (
            <div className="rounded border border-red-900/60 bg-red-900/20 px-3 py-2 text-sm text-red-300">
              {formError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addRow}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              + Tambah Blok
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Simpan Detail
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TBSBlockModal
