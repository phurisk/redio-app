# แก้ปัญหาเสียงดุดและ Streaming Issues

เขียนจากประสบการณ์จริงที่เจอปัญหาตอนทำ web radio

## ปัญหาที่เจอบ่อย

### 1. เสียงดุดๆ ข้ามๆ

สาเหตุหลักๆ คือ:
- Buffer ไม่พอ - browser ไม่มีเวลา buffer เสียงล่วงหน้า
- Network ช้า - connection ไม่เสถียร
- Bitrate สูงเกินไป - กิน bandwidth เยอะ

### 2. Progress bar ไปชนสุด (ถ้าใช้ HTML audio controls)

Live stream ไม่มี duration ดังนั้น progress bar จะทำงานผิดพลาด ไม่ควรใช้กับ live stream

## วิธีแก้

### เพิ่ม Buffer ใน Icecast

เข้าไปแก้ config:

```bash
docker exec -it azuracast bash
nano /etc/icecast2/icecast.xml
```

หาส่วน `<limits>` แล้วเพิ่ม/แก้เป็น:

```xml
<limits>
    <clients>100</clients>
    <sources>2</sources>
    <queue-size>524288</queue-size>
    <client-timeout>30</client-timeout>
    <header-timeout>15</header-timeout>
    <source-timeout>10</source-timeout>
    <burst-on-connect>1</burst-on-connect>
    <burst-size>65535</burst-size>
</limits>
```

ตัวสำคัญคือ:
- `burst-on-connect` - ส่งข้อมูลก้อนแรกทันทีตอนเชื่อมต่อ
- `burst-size` - ขนาดข้อมูลก้อนแรก (64KB)

บันทึกแล้ว restart:

```bash
exit
docker restart azuracast
```

### ลด Bitrate

ถ้ายังดุดอยู่ ลอง:

1. ไปที่ Station → Mount Points
2. Edit `/radio.mp3`
3. เปลี่ยน Bitrate เป็น 128 kbps (หรือ 96 kbps ถ้า connection ช้า)
4. Save แล้ว Restart Broadcasting

**Bitrate แนะนำ:**
- 192 kbps - คุณภาพดีมาก (ใช้ bandwidth เยอะ)
- 128 kbps - พอดี สำหรับ internet ทั่วไป
- 96 kbps - สำหรับ connection ช้า
- 64 kbps - สำหรับ mobile/3G

### เพิ่ม CORS Headers

สำคัญมากถ้าจะเล่นจาก web browser:

```bash
docker exec -it azuracast bash
nano /etc/icecast2/icecast.xml
```

เพิ่มใน `<icecast>`:

```xml
<http-headers>
    <header name="Access-Control-Allow-Origin" value="*" />
    <header name="Access-Control-Allow-Headers" value="Origin, Accept, X-Requested-With, Content-Type" />
    <header name="Access-Control-Allow-Methods" value="GET, OPTIONS, HEAD" />
    <header name="Cache-Control" value="no-cache, no-store" />
</http-headers>
```

```bash
exit
docker restart azuracast
```

### ปรับ Frontend

ใน `page.tsx` ใช้:
- `preload="auto"` - buffer ล่วงหน้า
- `crossOrigin="anonymous"` - แก้ CORS
- Auto-reconnect - ถ้า stream ขาดจะลองเชื่อมต่อใหม่อัตโนมัติ

(Code ที่ให้ไปทำไว้แล้ว)

## ทดสอบ Stream

### ใช้ curl

```bash
curl -I http://localhost:8000/radio.mp3
```

ควรได้ `HTTP/1.1 200 OK`

### ใช้ ffprobe

```bash
sudo apt install ffmpeg
ffprobe http://localhost:8000/radio.mp3
```

ดูที่:
- Bitrate: ควรตรงกับที่ตั้งไว้
- Sample rate: 44100 Hz
- Channels: stereo (2)

### ใช้ Browser DevTools

1. เปิด DevTools (F12)
2. ไปที่ Network tab
3. เล่น stream
4. ดูที่ `radio.mp3` ควรโหลดต่อเนื่อง ไม่มี stall

## Troubleshooting

### เสียงยังดุดอยู่

1. ลด bitrate เหลือ 96 kbps
2. เช็ค CPU usage: `docker stats azuracast` (ไม่ควรเกิน 80%)
3. เช็ค network: `ping localhost` (ควรได้ < 10ms)

### Stream ขาดบ่อย

1. เพิ่ม RAM ให้ Docker (แนะนำ 4GB+)
2. Restart station: `docker exec azuracast supervisorctl restart station:*`

### Browser ไม่เล่น

1. เช็ค CORS headers (ดูข้างบน)
2. ลองใน Incognito mode
3. Clear browser cache

## Production Tips

ถ้าจะใช้จริงๆ:

1. ใช้ CDN (Cloudflare ฟรี)
2. ตั้ง bitrate 128 kbps
3. เปิด burst-on-connect
4. Monitor stream quality เป็นประจำ
5. มี backup plan ถ้า server down

## คำนวณ Bandwidth

- 1 listener × 128 kbps = ~960 KB/min = ~57 MB/hour
- 100 listeners × 128 kbps = ~5.7 GB/hour

วางแผน bandwidth ให้ดีก่อนเปิดใช้งานจริง

---

เขียนโดย: Phuris Kruacharee  
จากประสบการณ์จริงในการแก้ปัญหาต่างๆ ที่เจอ

หวังว่าจะช่วยได้!
