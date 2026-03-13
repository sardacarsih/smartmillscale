# Smart Mill Scale - Production Deployment

## Overview
Smart Mill Scale adalah aplikasi desktop berbasis Wails v2 untuk manajemen timbangan pabrik kelapa sawit dengan offline-first capabilities dan cloud synchronization.

## System Requirements

### Minimum Requirements:
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB
- **Storage**: 100MB free space
- **Network**: Internet connection untuk cloud sync (optional)

### Dependencies:
- Tidak memerlukan instalasi .NET Framework, Node.js, atau Go runtime
- Aplikasi ini standalone dan self-contained

## Installation

### Option 1: Portable Mode (Recommended)
1. Extract folder `SmartMillScale-Production` ke lokasi yang diinginkan
2. Jalankan `Smart Mill Scale.exe`
3. Database dan konfigurasi akan disimpan di folder yang sama

### Option 2: System Installation
1. Copy folder `SmartMillScale-Production` ke `C:\Program Files\SmartMillScale`
2. Hapus file `portable.txt` untuk menggunakan system-wide configuration
3. Database akan disimpan di `%LOCALAPPDATA%\SmartMillScale\data\`
4. Konfigurasi di `%LOCALAPPDATA%\SmartMillScale\config.json`

## Configuration

### Configuration File (`config.json`)
```json
{
  "device_id": "device-001",
  "server_url": "https://api.smartmillscale.com",
  "debug_mode": false,
  "api_key": "your-production-api-key-here"
}
```

### Environment Variables (Advanced)
- `SMARTMILL_DB_PATH`: Custom database path
- `SMARTMILL_DEVICE_ID`: Custom device identifier
- `SMARTMILL_SERVER_URL`: Custom server URL
- `SMARTMILL_API_KEY`: API key untuk cloud sync
- `SMARTMILL_PORTABLE=1`: Force portable mode

## Default Users

Aplikasi secara otomatis membuat users default pada first run:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin123 | ADMIN | Administrator lengkap |
| supervisor | supervisor123 | SUPERVISOR | Supervisor operations |
| operator | operator123 | TIMBANGAN | Operator timbangan |
| grading | grading123 | GRADING | Grading staff |

⚠️ **Important**: Ganti password default users setelah first login untuk keamanan.

## Database

### Location
- **Portable Mode**: `./data/smartmill.db`
- **Installation Mode**: `%LOCALAPPDATA%\SmartMillScale\data\smartmill.db`

### Features
- SQLite dengan CGO-free driver untuk compatibility
- Auto-migration pada startup
- Automatic backup dan recovery
- Optimized indexes untuk performance

## Troubleshooting

### Common Issues

#### 1. Application tidak start
- Pastikan Windows 10/11 64-bit
- Cek permissions folder
- Run as Administrator jika perlu

#### 2. Database errors
- Delete file `smartmill.db` untuk fresh installation
- Pastikan sufficient disk space
- Check write permissions

#### 3. Network/Sync issues
- Verify internet connection
- Check API key configuration
- Confirm server URL accessibility

#### 4. Login issues
- Gunakan default users (lihat table di atas)
- Case-sensitive username
- Reset database jika lupa password

### Log Files
- Windows Event Viewer untuk system logs
- Application console untuk runtime errors
- Database audit trail di `audit_logs` table

## Security Considerations

### Production Setup
1. **API Key**: Gunakan API key yang valid untuk production
2. **Password**: Enforce password change policy
3. **Network**: Configure firewall untuk outbound connections
4. **File Permissions**: Limit access ke database files

### Data Protection
- Local SQLite encryption (optional)
- Regular backup database files
- Audit trail untuk compliance
- Session timeout configuration

## Performance Optimization

### Database Maintenance
- Auto VACUUM dan ANALYZE
- Index optimization
- Connection pooling (SQLite limit: 1 writer)

### Application Settings
- Disable debug mode di production
- Optimize sync intervals
- Configure cache settings

## Updates and Maintenance

### Update Process
1. Backup existing database
2. Replace executable dengan versi baru
3. Jalankan aplikasi (auto-migration will run)
4. Verify functionality

### Backup Strategy
- Regular backup `smartmill.db`
- Export configuration files
- Document custom settings
- Version control untuk database schema changes

## Support

### Technical Support
- Email: support@smartmillscale.com
- Documentation: https://docs.smartmillscale.com
- Issues: GitHub repository issues

### File Locations untuk Debugging
- Executable: `Smart Mill Scale.exe`
- Database: `data/smartmill.db` (portable) atau `%LOCALAPPDATA%\SmartMillScale\data\smartmill.db`
- Config: `config.json` (portable) atau `%LOCALAPPDATA%\SmartMillScale\config.json`
- Logs: Windows Event Log + Console output

## Version Information
- Version: 1.0.0
- Build: Production
- Platform: Windows 64-bit
- Framework: Wails v2 + React 18

---
**© 2025 Smart Mill Scale. All rights reserved.**