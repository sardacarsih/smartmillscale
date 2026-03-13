import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from './DataTable'

describe('DataTable', () => {
  const columns = [
    { key: 'kode_estate', title: 'Kode' },
    { key: 'nama_estate', title: 'Nama' }
  ]

  it('disables edit and delete buttons when row is read-only', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <DataTable
        data={[{ id: 1, kode_estate: 'EST01', nama_estate: 'Estate 1', data_source: 'SERVER' }]}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={() => false}
        canDelete={() => false}
      />
    )

    const editButton = screen.getByRole('button', { name: 'Edit' })
    const deleteButton = screen.getByRole('button', { name: 'Delete' })

    expect(editButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()

    fireEvent.click(editButton)
    fireEvent.click(deleteButton)

    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })
})
