import { describe, it, expect } from 'vitest'
import { parsePagination, totalPages } from './pagination.js'

describe('pagination', () => {
  describe('parsePagination', () => {
    it('returns default values if no params', () => {
      expect(parsePagination({})).toEqual({
        perPage: 25,
        page: 1,
        offset: 0,
      })
    })

    it('returns default page if not provided', () => {
      expect(parsePagination({ perPage: 50 })).toEqual({
        perPage: 50,
        page: 1,
        offset: 0,
      })
    })

    it('returns default perPage if not provided', () => {
      expect(parsePagination({ page: 3 })).toEqual({
        perPage: 25,
        page: 3,
        offset: 50,
      })
    })

    it('returns default page if negative', () => {
      expect(parsePagination({ page: -5, perPage: 50 })).toEqual({
        perPage: 50,
        page: 1,
        offset: 0,
      })
    })

    it('returns default perPage if negative', () => {
      expect(parsePagination({ page: 3, perPage: -15 })).toEqual({
        perPage: 25,
        page: 3,
        offset: 50,
      })
    })

    it('caps perPage if surpasses the maximum allowed value', () => {
      expect(parsePagination({ page: 3, perPage: 9999 })).toEqual({
        perPage: 50,
        page: 3,
        offset: 100,
      })
    })

    it('calculates offset', () => {
      expect(parsePagination({ page: 5, perPage: 15 })).toEqual({
        perPage: 15,
        page: 5,
        offset: 60,
      })
    })
  })

  describe('totalPages', () => {
    it('throws if perPage is 0', () => {
      expect(() => totalPages(10, 0)).toThrow('perPage must be greater than 0')
    })

    it('upper round for odd split', () => {
      expect(totalPages(7, 3)).toBe(3)
    })

    it('calculates multiple pages', () => {
      expect(totalPages(10, 5)).toBe(2)
    })

    it('calculates exact pages', () => {
      expect(totalPages(10, 10)).toBe(1)
    })

    it('calculates zero pages', () => {
      expect(totalPages(0, 10)).toBe(0)
    })
  })
})
