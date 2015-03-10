#pragma once

/**
 * aplite and SDK 2.9 compatibility utilities
 * These are a collection of types and compatibility macros taken from SDK 3.0.
 * When possible, they are copied directly without modification.
 */

#ifndef PBL_COLOR

#define GColorWhiteARGB8 ((uint8_t)0b11111111)
#define GColorBlackARGB8 ((uint8_t)0b11000000)
#define GColorClearARGB8 ((uint8_t)0b00000000)

typedef union GColor8 {
  uint8_t argb;
  struct {
    uint8_t b:2; //!< Blue
    uint8_t g:2; //!< Green
    uint8_t r:2; //!< Red
    uint8_t a:2; //!< Alpha. 3 = 100% opaque, 2 = 66% opaque, 1 = 33% opaque, 0 = transparent.
  };
} GColor8;

//! Convenience macro to enable use of SDK 3.0 function to compare equality of two colors.
#define GColorEq(a, b) ((a) == (b))


//! The format of a GBitmap can either be 1-bit or 8-bit.
typedef enum GBitmapFormat {
  GBitmapFormat1Bit = 0, //<! 1-bit black and white. 0 = black, 1 = white.
  GBitmapFormat8Bit,      //<! 6-bit color + 2 bit alpha channel. See \ref GColor8 for pixel format.
  GBitmapFormat1BitPalette,
  GBitmapFormat2BitPalette,
  GBitmapFormat4BitPalette,
} GBitmapFormat;

#define GBITMAP_NATIVE_FORMAT GBitmapFormat1Bit

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `row_size_bytes` field.
#ifndef gbitmap_get_bytes_per_row
#define gbitmap_get_bytes_per_row(bmp) ((bmp)->row_size_bytes)
#endif

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `bounds` field.
#ifndef gbitmap_get_bounds
#define gbitmap_get_bounds(bmp) ((bmp)->bounds)
#endif

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `addr` field.
#ifndef gbitmap_get_data
#define gbitmap_get_data(bmp) ((bmp)->addr)
#endif

//! Convenience function to use SDK 3.0 function to set a `GBitmap`'s `bounds` field.
#ifndef gbitmap_set_bounds
#define gbitmap_set_bounds(bmp, new_bounds) ((bmp)->bounds = (new_bounds))
#endif

//! Convenience function to use SDK 3.0 function to set a `GBitmap`'s `addr` field.
//! Modified to support row_size_bytes and free_on_destroy.
//! Change to ifndef when SDK 3.0 supports those additional parameters.
#undef gbitmap_set_data
#define gbitmap_set_data(bmp, data, fmt, rsb, fod) ({ \
  __typeof__(bmp) __gbitmap_tmp_bmp = (bmp); \
  __gbitmap_tmp_bmp->addr = (data); \
  __gbitmap_tmp_bmp->is_heap_allocated = (fod); \
  __gbitmap_tmp_bmp->row_size_bytes = (rsb); \
})


//! Convenience macro to use SDK 3.0 function to set a `PropertyAnimation`'s
//! `values.from.grect` field.
#ifndef property_animation_set_from_grect
#define property_animation_set_from_grect(prop_anim, value_ptr) \
  ((prop_anim)->values.from.grect = *(value_ptr))
#endif

//! Convenience macro to use SDK 3.0 function to set a `PropertyAnimation`'s
//! `values.to.grect` field.
#ifndef property_animation_set_to_grect
#define property_animation_set_to_grect(prop_anim, value_ptr) \
  ((prop_anim)->values.to.grect = *(value_ptr))
#endif

#endif
