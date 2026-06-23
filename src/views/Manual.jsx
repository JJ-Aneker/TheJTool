import { useState, useEffect, useRef } from 'react'
import { BookOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getHelpSections, MANUAL_TOC } from '../help/helpContent'
import '../styles/manual.css'

export default function Manual() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [activeSection, setActiveSection] = useState('home')
  const contentRef = useRef(null)
  const sectionRefs = useRef({})

  const sections = getHelpSections(lang)
  const pageSubtitle = lang === 'en'
    ? 'Complete documentation for all platform tools.'
    : 'Documentación completa de todas las herramientas de la plataforma.'
  const pageTitle = lang === 'en' ? 'User Manual' : 'Manual de usuario'
  const tocHeader = lang === 'en' ? 'Contents' : 'Contenido'

  // Sync active TOC item while scrolling
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const onScroll = () => {
      const scrollTop = container.scrollTop + 80
      let current = MANUAL_TOC[0].key
      for (const item of MANUAL_TOC) {
        const el = sectionRefs.current[item.key]
        if (el && el.offsetTop <= scrollTop) current = item.key
      }
      setActiveSection(current)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  // Handle anchor from URL hash (e.g. /manual#documentGenerator)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && sectionRefs.current[hash]) {
      scrollTo(hash)
    }
  }, [])

  const scrollTo = (key) => {
    const el = sectionRefs.current[key]
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
      setActiveSection(key)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Page header */}
      <div className="header-main" style={{ flexShrink: 0 }}>
        <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <BookOutlined /> {pageTitle}
        </h1>
        <div className="header-actions">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            theJay ToolBox · v0.1
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="manual-layout" style={{ flex: 1, minHeight: 0 }}>

        {/* TOC sidebar */}
        <nav className="manual-toc">
          <div className="manual-toc-header">{tocHeader}</div>
          {MANUAL_TOC.map(item => (
            <button
              key={item.key}
              className={`manual-toc-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => scrollTo(item.key)}
            >
              <span>{item.icon}</span>
              <span>{lang === 'en' ? item.labelEn : item.labelEs}</span>
            </button>
          ))}
        </nav>

        {/* Content area */}
        <main className="manual-content" ref={contentRef}>
          <p className="manual-page-subtitle">{pageSubtitle}</p>

          {MANUAL_TOC.map(tocItem => {
            const sec = sections[tocItem.key]
            if (!sec) return null
            return (
              <section
                key={sec.id}
                id={sec.id}
                className="manual-section"
                ref={el => { sectionRefs.current[tocItem.key] = el }}
              >
                <div className="manual-section-header">
                  <span className="manual-section-icon">{tocItem.icon}</span>
                  <h2 className="manual-section-title">{sec.title}</h2>
                </div>
                <p className="manual-section-intro">{sec.intro}</p>
                {sec.sections.map(sub => (
                  <div key={sub.id} className="manual-subsection" id={sub.id}>
                    <h3 className="manual-subsection-title">{sub.title}</h3>
                    <div
                      className="manual-subsection-body"
                      dangerouslySetInnerHTML={{ __html: sub.body }}
                    />
                  </div>
                ))}
              </section>
            )
          })}
        </main>
      </div>
    </div>
  )
}
