import { Children } from 'react'
import './styles.css'

/**
 * SectionDisplay — pure display controller.
 *
 * Props:
 *   title     {string}  — heading label for the section
 *   children            — expects <Fold> components as children;
 *                         renders them grouped under a shared heading
 */
export const SectionDisplay = ({ title, children }) => (
  <section className="section">
    {title && <h2 className="section__title">{title}</h2>}
    <div className="section__folds">
      {Children.map(children, (child) => (
        <div className="section__fold">{child}</div>
      ))}
    </div>
  </section>
)

/**
 * Section — stateless grouping container for Fold components.
 *
 * Wraps related Fold components under a titled section so that
 * components meant to work together can be rendered side by side.
 *
 * Props:
 *   title     {string}  — section heading (optional)
 *   children            — <Fold> components to group
 */
const Section = ({ title, children }) => (
  <SectionDisplay title={title}>
    {children}
  </SectionDisplay>
)

export default Section

