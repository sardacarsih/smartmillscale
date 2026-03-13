import { describe, it, expect, beforeEach, vi } from 'vitest'
import useNavigationStore from './useNavigationStore'

describe('useNavigationStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        const store = useNavigationStore.getState()
        store.resetNavigation()
    })

    describe('State Awal', () => {
        it('harus memiliki state awal yang benar', () => {
            const store = useNavigationStore.getState()

            expect(store.currentPage).toBe('dashboard')
            expect(store.navigationHistory).toEqual(['dashboard'])
        })
    })

    describe('Fungsi navigateTo', () => {
        it('harus navigate ke halaman baru', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('timbang1')

            expect(store.currentPage).toBe('timbang1')
            expect(store.navigationHistory).toEqual(['dashboard', 'timbang1'])
        })

        it('harus menambahkan halaman ke history', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('master-data')
            store.navigateTo('users')
            store.navigateTo('profile')

            expect(store.navigationHistory).toEqual(['dashboard', 'master-data', 'users', 'profile'])
            expect(store.currentPage).toBe('profile')
        })

        it('harus menghindari duplikasi halaman yang sama di history', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('timbang1')
            store.navigateTo('timbang1')
            store.navigateTo('timbang1')

            expect(store.navigationHistory).toEqual(['dashboard', 'timbang1'])
            expect(store.currentPage).toBe('timbang1')
        })

        it('harus navigate ke semua halaman yang tersedia', () => {
            const store = useNavigationStore.getState()
            const pages = ['dashboard', 'timbang1', 'master-data', 'users', 'audit', 'profile', 'help', 'settings']

            pages.forEach((page, index) => {
                store.navigateTo(page)
                expect(store.currentPage).toBe(page)
            })
        })
    })

    describe('Fungsi setCurrentPage', () => {
        it('harus set current page tanpa mengupdate history', () => {
            const store = useNavigationStore.getState()
            const initialHistory = [...store.navigationHistory]

            store.setCurrentPage('profile')

            expect(store.currentPage).toBe('profile')
            expect(store.navigationHistory).toEqual(initialHistory)
        })
    })

    describe('Fungsi goBack', () => {
        it('harus kembali ke halaman sebelumnya', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('timbang1')
            store.navigateTo('master-data')

            store.goBack()

            expect(store.currentPage).toBe('timbang1')
            expect(store.navigationHistory).toEqual(['dashboard', 'timbang1'])
        })

        it('harus navigate ke dashboard jika tidak ada history', () => {
            const store = useNavigationStore.getState()

            // Clear history manually
            store.navigationHistory = []
            store.goBack()

            expect(store.currentPage).toBe('dashboard')
            expect(store.navigationHistory).toEqual(['dashboard'])
        })

        it('harus handle multiple back navigations', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('timbang1')
            store.navigateTo('master-data')
            store.navigateTo('users')

            store.goBack() // users -> master-data
            expect(store.currentPage).toBe('master-data')

            store.goBack() // master-data -> timbang1
            expect(store.currentPage).toBe('timbang1')

            store.goBack() // timbang1 -> dashboard
            expect(store.currentPage).toBe('dashboard')
        })
    })

    describe('Fungsi resetNavigation', () => {
        it('harus reset navigation ke dashboard', () => {
            const store = useNavigationStore.getState()

            store.navigateTo('timbang1')
            store.navigateTo('master-data')
            store.navigateTo('users')

            store.resetNavigation()

            expect(store.currentPage).toBe('dashboard')
            expect(store.navigationHistory).toEqual(['dashboard'])
        })
    })

    describe('Akses Halaman Berdasarkan Role - ADMIN', () => {
        it('ADMIN harus bisa mengakses dashboard', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses timbang1', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('timbang1', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses master-data', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('master-data', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses users', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('users', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses audit', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('audit', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses profile', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('profile', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses help', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('help', 'ADMIN')).toBe(true)
        })

        it('ADMIN harus bisa mengakses settings', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('settings', 'ADMIN')).toBe(true)
        })
    })

    describe('Akses Halaman Berdasarkan Role - SUPERVISOR', () => {
        it('SUPERVISOR harus bisa mengakses dashboard', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR harus bisa mengakses timbang1', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('timbang1', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR harus bisa mengakses master-data', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('master-data', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR harus bisa mengakses audit', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('audit', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR harus bisa mengakses profile', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('profile', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR harus bisa mengakses help', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('help', 'SUPERVISOR')).toBe(true)
        })

        it('SUPERVISOR TIDAK bisa mengakses settings', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('settings', 'SUPERVISOR')).toBe(false)
        })

        it('SUPERVISOR TIDAK bisa mengakses users', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('users', 'SUPERVISOR')).toBe(false)
        })
    })

    describe('Akses Halaman Berdasarkan Role - TIMBANGAN', () => {
        it('TIMBANGAN harus bisa mengakses dashboard', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', 'TIMBANGAN')).toBe(true)
        })

        it('TIMBANGAN harus bisa mengakses timbang1', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('timbang1', 'TIMBANGAN')).toBe(true)
        })

        it('TIMBANGAN harus bisa mengakses profile', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('profile', 'TIMBANGAN')).toBe(true)
        })

        it('TIMBANGAN harus bisa mengakses help', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('help', 'TIMBANGAN')).toBe(true)
        })

        it('TIMBANGAN TIDAK bisa mengakses master-data', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('master-data', 'TIMBANGAN')).toBe(false)
        })

        it('TIMBANGAN TIDAK bisa mengakses users', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('users', 'TIMBANGAN')).toBe(false)
        })

        it('TIMBANGAN TIDAK bisa mengakses audit', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('audit', 'TIMBANGAN')).toBe(false)
        })

        it('TIMBANGAN TIDAK bisa mengakses settings', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('settings', 'TIMBANGAN')).toBe(false)
        })
    })

    describe('Akses Halaman Berdasarkan Role - GRADING', () => {
        it('GRADING harus bisa mengakses dashboard', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', 'GRADING')).toBe(true)
        })

        it('GRADING harus bisa mengakses profile', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('profile', 'GRADING')).toBe(true)
        })

        it('GRADING harus bisa mengakses help', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('help', 'GRADING')).toBe(true)
        })

        it('GRADING TIDAK bisa mengakses timbang1', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('timbang1', 'GRADING')).toBe(false)
        })

        it('GRADING TIDAK bisa mengakses master-data', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('master-data', 'GRADING')).toBe(false)
        })

        it('GRADING TIDAK bisa mengakses users', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('users', 'GRADING')).toBe(false)
        })

        it('GRADING TIDAK bisa mengakses audit', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('audit', 'GRADING')).toBe(false)
        })

        it('GRADING TIDAK bisa mengakses settings', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('settings', 'GRADING')).toBe(false)
        })
    })

    describe('Akses Halaman dengan Role Tidak Valid', () => {
        it('harus return false untuk role yang tidak dikenali', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', 'INVALID_ROLE')).toBe(false)
        })

        it('harus return false untuk halaman yang tidak ada', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('nonexistent-page', 'ADMIN')).toBe(false)
        })

        it('harus return false jika role undefined', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', undefined)).toBe(false)
        })

        it('harus return false jika role null', () => {
            const store = useNavigationStore.getState()
            expect(store.canAccessPage('dashboard', null)).toBe(false)
        })
    })

    describe('Fungsi getRoleDefaultRoute', () => {
        it('harus return default route untuk ADMIN', () => {
            const store = useNavigationStore.getState()
            const route = store.getRoleDefaultRoute('ADMIN')

            expect(route.page).toBe('dashboard')
            expect(route.label).toBe('Admin Dashboard')
            expect(route.description).toContain('System management')
        })

        it('harus return default route untuk SUPERVISOR', () => {
            const store = useNavigationStore.getState()
            const route = store.getRoleDefaultRoute('SUPERVISOR')

            expect(route.page).toBe('dashboard')
            expect(route.label).toBe('Supervisor Dashboard')
            expect(route.description).toContain('Monitoring')
        })

        it('harus return default route untuk TIMBANGAN', () => {
            const store = useNavigationStore.getState()
            const route = store.getRoleDefaultRoute('TIMBANGAN')

            expect(route.page).toBe('dashboard')
            expect(route.label).toBe('Timbangan Dashboard')
            expect(route.description).toContain('Weighing')
        })

        it('harus return default route untuk GRADING', () => {
            const store = useNavigationStore.getState()
            const route = store.getRoleDefaultRoute('GRADING')

            expect(route.page).toBe('dashboard')
            expect(route.label).toBe('Grading Dashboard')
            expect(route.description).toContain('Grading')
        })

        it('harus return fallback route untuk role yang tidak dikenali', () => {
            const store = useNavigationStore.getState()
            const route = store.getRoleDefaultRoute('UNKNOWN')

            expect(route.page).toBe('dashboard')
            expect(route.label).toBe('Dashboard')
            expect(route.description).toBe('Default dashboard')
        })
    })

    describe('Fungsi getNavigationItems', () => {
        it('harus return semua navigation items untuk ADMIN', () => {
            const store = useNavigationStore.getState()
            const items = store.getNavigationItems('ADMIN')

            expect(items.length).toBe(8) // dashboard, timbang1, master-data, profile, help, settings, users, audit
            expect(items.some(item => item.key === 'dashboard')).toBe(true)
            expect(items.some(item => item.key === 'timbang1')).toBe(true)
            expect(items.some(item => item.key === 'master-data')).toBe(true)
            expect(items.some(item => item.key === 'users')).toBe(true)
            expect(items.some(item => item.key === 'audit')).toBe(true)
            expect(items.some(item => item.key === 'settings')).toBe(true)
            expect(items.some(item => item.key === 'profile')).toBe(true)
            expect(items.some(item => item.key === 'help')).toBe(true)
        })

        it('harus return navigation items yang sesuai untuk SUPERVISOR', () => {
            const store = useNavigationStore.getState()
            const items = store.getNavigationItems('SUPERVISOR')

            expect(items.length).toBe(6) // dashboard, timbang1, master-data, profile, help, audit
            expect(items.some(item => item.key === 'dashboard')).toBe(true)
            expect(items.some(item => item.key === 'timbang1')).toBe(true)
            expect(items.some(item => item.key === 'master-data')).toBe(true)
            expect(items.some(item => item.key === 'audit')).toBe(true)
            expect(items.some(item => item.key === 'profile')).toBe(true)
            expect(items.some(item => item.key === 'help')).toBe(true)
            expect(items.some(item => item.key === 'users')).toBe(false)
            expect(items.some(item => item.key === 'settings')).toBe(false)
        })

        it('harus return navigation items yang sesuai untuk TIMBANGAN', () => {
            const store = useNavigationStore.getState()
            const items = store.getNavigationItems('TIMBANGAN')

            expect(items.length).toBe(4) // dashboard, timbang1, profile, help
            expect(items.some(item => item.key === 'dashboard')).toBe(true)
            expect(items.some(item => item.key === 'timbang1')).toBe(true)
            expect(items.some(item => item.key === 'profile')).toBe(true)
            expect(items.some(item => item.key === 'help')).toBe(true)
            expect(items.some(item => item.key === 'master-data')).toBe(false)
            expect(items.some(item => item.key === 'users')).toBe(false)
            expect(items.some(item => item.key === 'audit')).toBe(false)
        })

        it('harus return navigation items yang sesuai untuk GRADING', () => {
            const store = useNavigationStore.getState()
            const items = store.getNavigationItems('GRADING')

            expect(items.length).toBe(3) // dashboard, profile, help
            expect(items.some(item => item.key === 'dashboard')).toBe(true)
            expect(items.some(item => item.key === 'profile')).toBe(true)
            expect(items.some(item => item.key === 'help')).toBe(true)
            expect(items.some(item => item.key === 'timbang1')).toBe(false)
            expect(items.some(item => item.key === 'master-data')).toBe(false)
        })

        it('navigation items harus memiliki struktur yang benar', () => {
            const store = useNavigationStore.getState()
            const items = store.getNavigationItems('ADMIN')

            items.forEach(item => {
                expect(item).toHaveProperty('key')
                expect(item).toHaveProperty('label')
                expect(item).toHaveProperty('icon')
                expect(item).toHaveProperty('path')
                expect(item).toHaveProperty('roles')
                expect(Array.isArray(item.roles)).toBe(true)
            })
        })
    })
})
