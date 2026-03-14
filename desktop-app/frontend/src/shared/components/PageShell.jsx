import React from 'react'
import Topbar from './Topbar'

const WIDTH_CLASSES = {
  standard: 'max-w-6xl',
  wide: 'max-w-screen-xl',
  full: 'max-w-screen-2xl'
}

const PageShell = ({
  title = 'Smart Mill Scale',
  subtitle = '',
  currentUser,
  onLogout,
  onNavigate,
  pageTitle = '',
  pageDescription = '',
  pageActions = null,
  contentWidth = 'wide',
  contentClassName = '',
  children
}) => {
  const widthClass = WIDTH_CLASSES[contentWidth] || WIDTH_CLASSES.wide
  const hasPageHeader = Boolean(pageTitle || pageDescription || pageActions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Topbar
        title={title}
        subtitle={subtitle}
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      <main className="pb-6 pt-4 sm:pb-8 sm:pt-6 lg:pb-10 lg:pt-8">
        <div className={`${widthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
          {hasPageHeader && (
            <section className="mb-6 rounded-2xl border border-gray-800/80 bg-gray-900/70 px-4 py-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  {pageTitle && (
                    <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {pageTitle}
                    </h2>
                  )}
                  {pageDescription && (
                    <p className="mt-1 max-w-3xl text-sm text-gray-400 sm:text-base">
                      {pageDescription}
                    </p>
                  )}
                </div>
                {pageActions && (
                  <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    {pageActions}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className={contentClassName}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PageShell
