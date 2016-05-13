// This file was generated by colf(1); DO NOT EDIT

var testdata = new function() {
	const EOF = 'colfer: EOF';

	// The upper limit for serial byte sizes.
	var colferSizeMax = 16 * 1024 * 1024;

	// The upper limit for the number of elements in a list.
	var colferListMax = 64 * 1024;

	// Serializes the object into an Uint8Array.
	// All null entries in o.os will be replaced with an {}.
	this.marshalO = function(o) {
		var segs = [];

		if (o.b) {
			segs.push([0]);
		}

		if (o.u32) {
			if (o.u32 > 4294967295 || o.u32 < 0)
				throw 'colfer: field u32 out of reach: ' + o.u32;
			if (o.u32 < 0x200000) {
				var seg = [1];
				encodeVarint(seg, o.u32);
				segs.push(seg);
			} else {
				var bytes = new Uint8Array(5);
				bytes[0] = 1 | 128;
				var view = new DataView(bytes.buffer);
				view.setUint32(1, o.u32);
				segs.push(bytes)
			}
		}

		if (o.u64) {
			if (o.u64 < 0)
				throw 'colfer: field u64 out of reach: ' + o.u64;
			if (o.u64 > Number.MAX_SAFE_INTEGER)
				throw 'colfer: field u64 exceeds Number.MAX_SAFE_INTEGER';
			if (o.u64 < 0x2000000000000) {
				var seg = [2];
				encodeVarint(seg, o.u64);
				segs.push(seg);
			} else {
				var bytes = new Uint8Array(9);
				bytes[0] = 2 | 128;
				var view = new DataView(bytes.buffer);
				view.setUint32(1, o.u64 / 0x100000000);
				view.setUint32(5, o.u64 % 0x100000000);
				segs.push(bytes)
			}
		}

		if (o.i32) {
			var seg = [3];
			if (o.i32 < 0) {
				seg[0] |= 128;
				if (o.i32 < -2147483648) throw 'colfer: field i32 exceeds 32-bit range';
				encodeVarint(seg, -o.i32);
			} else {
				if (o.i32 > 2147483647) throw 'colfer: field i32 exceeds 32-bit range';
				encodeVarint(seg, o.i32);
			}
			segs.push(seg);
		}

		if (o.i64) {
			var seg = [4];
			if (o.i64 < 0) {
				seg[0] |= 128;
				if (o.i64 < -Number.MAX_SAFE_INTEGER) throw 'colfer: field i64 exceeds Number.MAX_SAFE_INTEGER';
				encodeVarint(seg, -o.i64);
			} else {
				if (o.i64 > Number.MAX_SAFE_INTEGER) throw 'colfer: field i64 exceeds Number.MAX_SAFE_INTEGER';
				encodeVarint(seg, o.i64);
			}
			segs.push(seg);
		}

		if (o.f32 || Number.isNaN(o.f32)) {
			if (o.f32 > 3.4028234663852886E38 || o.f32 < -3.4028234663852886E38)
				throw 'colfer: field f32 exceeds 32-bit range';
			var bytes = new Uint8Array(5);
			bytes[0] = 5;
			new DataView(bytes.buffer).setFloat32(1, o.f32);
			segs.push(bytes);
		}

		if (o.f64 || Number.isNaN(o.f64)) {
			var bytes = new Uint8Array(9);
			bytes[0] = 6;
			new DataView(bytes.buffer).setFloat64(1, o.f64);
			segs.push(bytes);
		}

		if (o.t) {
			var ms = o.t.getTime()
			if ((ms < 0) || (ms > Number.MAX_SAFE_INTEGER))
				throw 'colfer: field t millisecond value not in range (0, Number.MAX_SAFE_INTEGER)';
			var s = ms / 1E3;
			var ns = o.t_ns
			if (ns) {
				if ((ns < 0) || (ns >= 1E6))
					throw 'colfer: field t_ns not in range (0, 1ms>';
			} else ns = 0;
			ns += (ms % 1E3) * 1E6;

			if (s != 0 || ns != 0) {
				if (s > 0xffffffff) {
					var bytes = new Uint8Array(13);
					bytes[0] = 7 | 128;
					var view = new DataView(bytes.buffer);
					view.setUint32(1, s / 0x100000000);
					view.setUint32(5, s);
					view.setUint32(9, ns);
					segs.push(bytes);
				} else {
					var bytes = new Uint8Array(9);
					bytes[0] = 7;
					var view = new DataView(bytes.buffer);
					view.setUint32(1, s);
					view.setUint32(5, ns);
					segs.push(bytes);
				}
			}
		}

		if (o.s) {
			var utf = encodeUTF8(o.s);
			var seg = [8];
			encodeVarint(seg, utf.length);
			segs.push(seg);
			segs.push(utf)
		}

		if (o.a && o.a.length) {
			var seg = [9];
			encodeVarint(seg, o.a.length);
			segs.push(seg);
			segs.push(o.a);
		}

		if (o.o) {
			segs.push([10]);
			segs.push(testdata.marshalO(o.o));
		}

		if (o.os && o.os.length) {
			var a = o.os;
			if (a.length > colferListMax) throw 'colfer: field os length exceeds colferListMax';
			var seg = [11];
			encodeVarint(seg, a.length);
			segs.push(seg);
			for (var i = 0; i < a.length; i++) {
				var v = a[i];
				if (! v) {
					v = {};
					a[i] = v;
				}
				segs.push(testdata.marshalO(v));
			};
		}

		var size = 1;
		segs.forEach(function(seg) {
			size += seg.length;
		});

		var bytes = new Uint8Array(size);
		var i = 0;
		segs.forEach(function(seg) {
			bytes.set(seg, i);
			i += seg.length;
		});
		bytes[i] = 127;
		return bytes;
	}

	// Deserializes an object from an Uint8Array.
	this.unmarshalO = function(data) {
		if (!data || ! data.length) return null;
		var header = data[0];
		var i = 1;
		var readHeader = function() {
			if (i == data.length) throw EOF;
			header = data[i++];
		}

		var readVarint = function() {
			var pos = 0, result = 0;
			while (pos != 8) {
				var c = data[i+pos];
				result += (c & 127) * Math.pow(128, pos);
				++pos;
				if (c < 128) {
					i += pos;
					if (result > Number.MAX_SAFE_INTEGER) break;
					return result;
				}
				if (pos == data.length) throw EOF;
			}
			return -1;
		}

		var o = {};

		if (header == 0) {
			o.b = true;
			readHeader();
		}

		if (header == 1) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field u32 exceeds Number.MAX_SAFE_INTEGER';
			o.u32 = x;
			readHeader();
		} else if (header == (1 | 128)) {
			if (i + 4 > data.length) throw EOF;
			o.u32 = new DataView(data.buffer).getUint32(i);
			i += 4;
			readHeader();
		}

		if (header == 2) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field u64 exceeds Number.MAX_SAFE_INTEGER';
			o.u64 = x;
			readHeader();
		} else if (header == (2 | 128)) {
			if (i + 8 > data.length) throw EOF;
			var view = new DataView(data.buffer);
			var x = view.getUint32(i) * 0x100000000;
			x += view.getUint32(i + 4);
			if (x > Number.MAX_SAFE_INTEGER)
				throw 'colfer: field u64 exceeds Number.MAX_SAFE_INTEGER';
			o.u64 = x;
			i += 8;
			readHeader();
		}

		if (header == 3) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field i32 exceeds Number.MAX_SAFE_INTEGER';
			o.i32 = x;
			readHeader();
		} else if (header == (3 | 128)) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field i32 exceeds Number.MAX_SAFE_INTEGER';
			o.i32 = -1 * x;
			readHeader();
		}

		if (header == 4) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field i64 exceeds Number.MAX_SAFE_INTEGER';
			o.i64 = x;
			readHeader();
		} else if (header == (4 | 128)) {
			var x = readVarint();
			if (x < 0) throw 'colfer: field i64 exceeds Number.MAX_SAFE_INTEGER';
			o.i64 = -1 * x;
			readHeader();
		}

		if (header == 5) {
			if (i + 4 > data.length) throw EOF;
			o.f32 = new DataView(data.buffer).getFloat32(i);
			i += 4;
			readHeader();
		}

		if (header == 6) {
			if (i + 8 > data.length) throw EOF;
			o.f64 = new DataView(data.buffer).getFloat64(i);
			i += 8;
			readHeader();
		}

		if (header == 7) {
			if (i + 8 > data.length) throw EOF;
			var view = new DataView(data.buffer);
			var ms = view.getUint32(i) * 1000;
			var ns = view.getUint32(i + 4);
			ms += ns / 1E6;
			ns %= 1E6;
			if (ms > Number.MAX_SAFE_INTEGER)
				throw 'colfer: field t value exceeds Number capacity for ms';
			i += 8;
			o.t = new Date();
			o.t.setTime(ms);
			o.t_ns = ns;
			readHeader();
		} else if (header == (7 | 128)) {
			if (i + 12 > data.length) throw EOF;
			var view = new DataView(data.buffer);
			var ms = view.getUint32(i) * 0x100000000;
			ms += view.getUint32(i + 4);
			ms *= 1000;
			var ns = view.getUint32(i + 8);
			ms += ns / 1E6;
			ns %= 1E6;
			if (ms > Number.MAX_SAFE_INTEGER)
				throw 'colfer: field t value exceeds Number capacity for ms';
			i += 12;
			o.t = new Date();
			o.t.setTime(ms);
			o.t_ns = ns;
			readHeader();
		}

		if (header == 8) {
			var length = readVarint();
			if (length < 0) throw 'colfer: field s length exceeds Number.MAX_SAFE_INTEGER';
			var to = i + length;
			if (to > data.length) throw EOF;
			o.s = decodeUTF8(data.subarray(i, to));
			i = to;
			readHeader();
		}

		if (header == 9) {
			var length = readVarint();
			if (length < 0) throw 'colfer: field a length exceeds Number.MAX_SAFE_INTEGER';
			var to = i + length;
			if (to > data.length) throw EOF;
			o.a = data.subarray(i, to);
			i = to;
			readHeader();
		}

		if (header == 10) {
			try {
				testdata.unmarshalO(data.subarray(i));
				throw EOF;
			} catch (err) {
				if (! err.continueAt) throw err;
				i += err.continueAt;
				o.o = err.o;
			}
			readHeader();
		}

		if (header == 11) {
			var length = readVarint();
			if (length < 0) throw 'colfer: field os length exceeds Number.MAX_SAFE_INTEGER';
			else if (length > colferListMax) throw 'colfer: field os length exceeds colferListMax';
			o.os = [];
			while (--length >= 0) {
				try {
					testdata.unmarshalO(data.subarray(i));
					throw EOF;
				} catch (err) {
					if (! err.continueAt) throw err;
					i += err.continueAt;
					o.os.push(err.o);
				}
			}
			readHeader();
		}

		if (header != 127) throw 'colfer: unknown header at byte ' + (i - 1);
		if (i != data.length) throw {
			msg: 'colfer: data continuation at byte ' + i,
			continueAt: i,
			o: o
		};
		return o;
	}

	var encodeVarint = function(bytes, x) {
		while (x > 127) {
			bytes.push(x|128);
			x /= 128;
		}
		bytes.push(x&127);
		return bytes;
	}

	// Marshals a string to Uint8Array.
	var encodeUTF8 = function(s) {
		var i = 0;
		var bytes = new Uint8Array(s.length * 4);
		for (var ci = 0; ci != s.length; ci++) {
			var c = s.charCodeAt(ci);
			if (c < 128) {
				bytes[i++] = c;
				continue;
			}
			if (c < 2048) {
				bytes[i++] = c >> 6 | 192;
			} else {
				if (c > 0xd7ff && c < 0xdc00) {
					if (++ci == s.length) throw 'UTF-8 encode: incomplete surrogate pair';
					var c2 = s.charCodeAt(ci);
					if (c2 < 0xdc00 || c2 > 0xdfff) throw 'UTF-8 encode: second char code 0x' + c2.toString(16) + ' at index ' + ci + ' in surrogate pair out of range';
					c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
					bytes[i++] = c >> 18 | 240;
					bytes[i++] = c>> 12 & 63 | 128;
				} else { // c <= 0xffff
					bytes[i++] = c >> 12 | 224;
				}
				bytes[i++] = c >> 6 & 63 | 128;
			}
			bytes[i++] = c & 63 | 128;
		}
		return bytes.subarray(0, i);
	}

	// Unmarshals an Uint8Array to string.
	var decodeUTF8 = function(bytes) {
		var s = '';
		var i = 0;
		while (i < bytes.length) {
			var c = bytes[i++];
			if (c > 127) {
				if (c > 191 && c < 224) {
					if (i >= bytes.length) throw 'UTF-8 decode: incomplete 2-byte sequence';
					c = (c & 31) << 6 | bytes[i] & 63;
				} else if (c > 223 && c < 240) {
					if (i + 1 >= bytes.length) throw 'UTF-8 decode: incomplete 3-byte sequence';
					c = (c & 15) << 12 | (bytes[i] & 63) << 6 | bytes[++i] & 63;
				} else if (c > 239 && c < 248) {
					if (i+2 >= bytes.length) throw 'UTF-8 decode: incomplete 4-byte sequence';
					c = (c & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[++i] & 63) << 6 | bytes[++i] & 63;
				} else throw 'UTF-8 decode: unknown multibyte start 0x' + c.toString(16) + ' at index ' + (i - 1);
				++i;
			}

			if (c <= 0xffff) s += String.fromCharCode(c);
			else if (c <= 0x10ffff) {
				c -= 0x10000;
				s += String.fromCharCode(c >> 10 | 0xd800)
				s += String.fromCharCode(c & 0x3FF | 0xdc00)
			} else throw 'UTF-8 decode: code point 0x' + c.toString(16) + ' exceeds UTF-16 reach';
		}
		return s;
	}
}
