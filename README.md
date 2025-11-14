# Web Radio Player with AzuraCast

สร้าง web radio ของตัวเองด้วย AzuraCast + Next.js

เคยอยากมี radio station เป็นของตัวเองมั้ย? โปรเจคนี้จะพาคุณสร้างตั้งแต่ติดตั้ง streaming server จนถึงทำ web player ที่สวยงาม

## เริ่มต้นอย่างไร

### ติดตั้ง Docker

ถ้ายังไม่มี Docker ให้ติดตั้งก่อน:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# เพิ่ม Docker repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER
newgrp docker
```

### ติดตั้ง AzuraCast

```bash
mkdir ~/azuracast && cd ~/azuracast

# ดาวน์โหลดไฟล์ที่จำเป็น
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh -o docker.sh
chmod +x docker.sh
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker-compose.sample.yml -o docker-compose.yml

# สร้างไฟล์ config
cat > azuracast.env << 'EOF'
COMPOSE_PROJECT_NAME=azuracast
AZURACAST_HTTP_PORT=8080
AZURACAST_HTTPS_PORT=443
AZURACAST_SFTP_PORT=2022
AZURACAST_PUID=1000
AZURACAST_PGID=1000
NGINX_TIMEOUT=1800
AZURACAST_VERSION=stable
EOF
```

**หมายเหตุ:** ใช้ port 8080 เพราะ port 80 อาจถูกใช้งานอยู่แล้ว

### แก้ปัญหา Port Conflict

ถ้ามี Apache หรือ Nginx ทำงานอยู่:

```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

แก้ไข docker-compose.yml ให้ map port ถูกต้อง:

```bash
sed -i "24s/.*/      - '\${AZURACAST_HTTP_PORT:-8080}:80'/" docker-compose.yml
```

### เริ่มใช้งาน

```bash
docker compose -f docker-compose.yml --env-file azuracast.env up -d
```

รอประมาณ 2 นาที แล้วเปิด `http://localhost:8080`

## แก้ปัญหา Database (ถ้าเจอ)

บางครั้ง MariaDB อาจไม่ start ให้ทำแบบนี้:

```bash
docker compose down
docker volume rm azuracast_db_data
docker compose -f docker-compose.yml --env-file azuracast.env up -d

# รอ 2 นาที แล้วรัน
docker exec azuracast bash -c "rm -rf /var/lib/mysql/* && mariadb-install-db --user=azuracast --datadir=/var/lib/mysql --skip-test-db"
docker restart azuracast

# รอ 2 นาทีอีกครั้ง
docker exec azuracast bash -c "mariadb -u root -e 'CREATE DATABASE IF NOT EXISTS azuracast CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'"
docker exec azuracast azuracast_install
```

## ตั้งค่า Station

1. เปิด `http://localhost:8080` แล้วสร้าง admin account
2. คลิก "Add Station"
3. ตั้งค่าพื้นฐาน:
   - Name: ชื่อ station ของคุณ
   - Broadcasting: เลือก Icecast
   - AutoDJ: เลือก Liquidsoap
4. อัพโหลดเพลงที่ Media
5. สร้าง Playlist แล้วเพิ่มเพลงเข้าไป
6. Restart Broadcasting

Stream URL จะอยู่ที่: `http://localhost:8000/radio.mp3`

## รัน Frontend

```bash
cd radio-player-nextjs
npm install
npm run dev
```

เปิด `http://localhost:3000` จะเห็น player สวยๆ

สร้างไฟล์ `.env.local` (ดูตัวอย่างใน repo) แล้วใส่ค่าพื้นฐาน:

```
NEXT_PUBLIC_STREAM_URL=/api/stream
STREAM_SOURCE_URL=http://localhost:8000/radio.mp3
```

## Deploy

### Vercel

1. Push code ขึ้น GitHub
2. Import project ใน Vercel
3. เพิ่ม environment variables:
   - `NEXT_PUBLIC_STREAM_URL` = `/api/stream`
   - `STREAM_SOURCE_URL` = URL ของ stream จริง (เช่น `https://radio.example.com/listen/.../radio.mp3`)
4. Deploy

### VPS

ถ้าจะใช้จริงๆ แนะนำย้าย AzuraCast ไป VPS:

- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB+

ติดตั้งแบบเดียวกับ local แต่ใช้ port 80 ได้เลย

ตั้งค่า domain และ HTTPS ด้วย Let's Encrypt ใน AzuraCast admin panel

## แก้ปัญหาเสียงดุด

ถ้าเสียงดุดๆ ให้แก้ Icecast config:

```bash
docker exec -it azuracast bash
nano /etc/icecast2/icecast.xml
```

เพิ่มใน `<limits>`:

```xml
<burst-on-connect>1</burst-on-connect>
<burst-size>65535</burst-size>
```

ออกแล้ว restart:

```bash
exit
docker restart azuracast
```

ดูวิธีแก้ปัญหาเพิ่มเติมใน [STREAMING-OPTIMIZATION.md](STREAMING-OPTIMIZATION.md)

## คำสั่งที่ใช้บ่อย

```bash
# Start
docker compose -f docker-compose.yml --env-file azuracast.env up -d

# Stop
docker compose down

# Restart
docker restart azuracast

# ดู logs
docker logs azuracast -f

# เช็คสถานะ
docker exec azuracast supervisorctl status
```

## Tech Stack

- **AzuraCast** - Streaming server
- **Next.js 14** - Frontend framework
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Docker** - Containerization

## License

MIT License - ใช้ได้ตามสบาย

Copyright (c) 2025 Phuris Kruacharee

## ผู้พัฒนา

**Phuris Kruacharee (ภูริศ เครือชารี)**

สร้างจากประสบการณ์จริงในการติดตั้งและแก้ปัญหาต่างๆ ที่เจอ

หวังว่าจะเป็นประโยชน์สำหรับคนที่อยากมี radio station เป็นของตัวเอง!
