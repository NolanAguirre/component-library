import { useCallback, useEffect, useState } from 'react'

export const DEFAULT_BRUSH_PALETTE = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#5856d6', '#ffffff', '#000000']
const DEFAULT_STORAGE_KEY = 'image-editor:color-palette'
const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value)

const loadPalette = (storageKey, defaults) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey))
    const colors = stored?.colors
    const selected = stored?.selected
    if (
      Array.isArray(colors) &&
      colors.length === defaults.length &&
      colors.every(isHex) &&
      Number.isInteger(selected) &&
      selected >= 0 &&
      selected < defaults.length
    ) {
      return { colors, selected }
    }
  } catch (error) {}
  return { colors: defaults, selected: 0 }
}

/**
 * Editable swatch palette persisted to localStorage. Pairs with ColorPicker's
 * palette / selectedIndex / selectSwatch / change props.
 */
const useBrushPalette = ({ storageKey = DEFAULT_STORAGE_KEY, defaults = DEFAULT_BRUSH_PALETTE } = {}) => {
  const [paletteState, setPaletteState] = useState(() => loadPalette(storageKey, defaults))
  const { colors: palette, selected: selectedSwatch } = paletteState
  const swatchColor = palette[selectedSwatch]

  const setSwatchColor = useCallback((hex) => {
    setPaletteState((prev) => ({ ...prev, colors: prev.colors.map((color, index) => (index === prev.selected ? hex : color)) }))
  }, [])
  const selectSwatch = useCallback((index) => {
    setPaletteState((prev) => ({ ...prev, selected: index }))
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(paletteState))
    } catch (error) {}
  }, [paletteState, storageKey])

  return { palette, paletteState, setPaletteState, selectedSwatch, swatchColor, setSwatchColor, selectSwatch }
}

export default useBrushPalette
