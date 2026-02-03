import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'


function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <ThemeProvider>
                <I18nProvider>
                    {children}
                </I18nProvider>
            </ThemeProvider>
        )
    }

    return render(ui, { wrapper: Wrapper, ...options })
}


export * from '@testing-library/react'
export { customRender as render }
