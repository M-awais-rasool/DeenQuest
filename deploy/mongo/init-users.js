// Least-privilege MongoDB users. Run once, as root, after rs.initiate().
//
//   docker compose exec -T mongo mongosh --tls --tlsCAFile /etc/mongo/tls/ca.pem \
//     -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
//     --file /etc/mongo/init-users.js
//
// The point of the split: if the API is compromised, the attacker can read and
// write application data — unavoidable — but cannot drop the database, create
// users, reach any other database, or read the backup credentials.

const appPassword = process.env.MONGO_APP_PASSWORD;
const backupPassword = process.env.MONGO_BACKUP_PASSWORD;

if (!appPassword || !backupPassword) {
  throw new Error("MONGO_APP_PASSWORD and MONGO_BACKUP_PASSWORD must be set");
}

const admin = db.getSiblingDB("admin");

// The application. readWrite on exactly one database, nothing else.
admin.createUser({
  user: "dq_app",
  pwd: appPassword,
  roles: [{ role: "readWrite", db: "deenquest" }],
});

// Backups. Read-only — a backup job never needs to write.
admin.createUser({
  user: "dq_backup",
  pwd: backupPassword,
  roles: [
    { role: "backup", db: "admin" },
    { role: "read", db: "deenquest" },
  ],
});

print("created dq_app (readWrite:deenquest) and dq_backup (read-only)");
