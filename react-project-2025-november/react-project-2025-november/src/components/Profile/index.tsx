import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";

type ProfileCardProps = {
    profile: UserInstance;
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const resolvedRole =
    profile?.role?.name ||
    (typeof profile?.role === "string" ? profile.role : undefined) ||
    AuthSession.getRoles();

  const email = profile?.email ?? AuthSession.getEmail();

  return (
    <div className="profile-section">
      <div className="profile-info">
        <h2>Merhaba, {profile?.name ?? AuthSession.getName() ?? "Kullanıcı"}</h2>
        <p>Bugün için planlanan vardiyalarınıza göz atabilirsiniz.</p>
      </div>
      <div className="profile-meta">
        <span>📧 {email || "E-posta bulunamadı"}</span>
        <span>🧑‍💼 {resolvedRole || "Rol bilgisi bekleniyor"}</span>
      </div>
    </div>
  );
};

export default ProfileCard;