import Storage from "../utils/storage";
import {
  SESSION_KEY_ID,
  SESSION_KEY_NAME,
  SESSION_KEY_EMAIL,
  SESSION_KEY_ROLES,
  SESSION_KEY_LANGUAGE,
  SESSION_KEY_PHONE_NUMBER,
  SESSION_KEY_DEPARTMENT_ID,
  SESSION_KEY_ORGANIZATION_ID,
} from "../constants/common";

class AuthSession {
  static sessionKey_id = SESSION_KEY_ID;
  static sessionKey_name = SESSION_KEY_NAME;
  static sessionKey_email = SESSION_KEY_EMAIL;
  static sessionKey_phone_number = SESSION_KEY_PHONE_NUMBER;
  static sessionKey_roles = SESSION_KEY_ROLES;
  static sessionKey_organization_id = SESSION_KEY_ORGANIZATION_ID;
  static sessionKey_department_id = SESSION_KEY_DEPARTMENT_ID;
  static sessionKey_language = SESSION_KEY_LANGUAGE;

  static getId(): string {
    return String(Storage.get(AuthSession.sessionKey_id));
  }

  static getName(): string {
    return Storage.get(AuthSession.sessionKey_name);
  }

  static getEmail(): string {
    return Storage.get(AuthSession.sessionKey_email);
  }

  static getPhoneNumber(): string {
    return Storage.get(AuthSession.sessionKey_phone_number);
  }

  static getRoles(): number {
    return Storage.get(AuthSession.sessionKey_roles);
  }

  static getOrganizationId(): string {
    return Storage.get(AuthSession.sessionKey_organization_id);
  }

  static getDepartmentId(): string {
    return Storage.get(AuthSession.sessionKey_department_id);
  }

  static getLanguage(): string {
    return Storage.get(AuthSession.sessionKey_language);
  }

  static setId(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_id, tokenValue);
  }

  static setName(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_name, tokenValue);
  }

  static setPhoneNumber(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_phone_number, tokenValue);
  }

  static setEmail(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_email, tokenValue);
  }

  static setRoles(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_roles, tokenValue);
  }

  static setOrganizationId(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_organization_id, tokenValue);
  }

  static setDepartmentId(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_department_id, tokenValue);
  }

  static setLanguage(tokenValue: string): void {
    Storage.set(AuthSession.sessionKey_language, tokenValue);
  }

  static remove(): void {
    Storage.remove(AuthSession.sessionKey_id);
    Storage.remove(AuthSession.sessionKey_name);
    Storage.remove(AuthSession.sessionKey_email);
    Storage.remove(AuthSession.sessionKey_phone_number);
    Storage.remove(AuthSession.sessionKey_roles);
    Storage.remove(AuthSession.sessionKey_organization_id);
    Storage.remove(AuthSession.sessionKey_department_id);
  }
}

export default AuthSession;
