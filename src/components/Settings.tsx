// Добавь в интерфейс Props:
interface SettingsProps {
  // ... существующие props
  disableRequests: boolean;
  onDisableRequestsChange: (value: boolean) => void;
}

// В компонент добавь:
export const Settings: React.FC<SettingsProps> = ({
  // ... деструктуризация
  disableRequests,
  onDisableRequestsChange
}) => {
  // В return добавь перед кнопкой сохранения:
  <div style={styles.settingRow}>
    <label style={styles.settingLabel}>
      <span>Запретить заявки</span>
      <input 
        type="checkbox" 
        checked={disableRequests} 
        onChange={(e) => onDisableRequestsChange(e.target.checked)}
        style={styles.checkbox}
      />
    </label>
  </div>