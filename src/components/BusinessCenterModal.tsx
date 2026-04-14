import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Clock, AlertCircle } from 'lucide-react';
import { BUSINESSES } from '../data/economy';

interface BusinessCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  rubBalance: number;
  ownedBusinesses: any[];
  businessMaintenance: Record<string, { electricity: number; repair: number }>;
  totalIncome: number;
  managerHired: boolean;
  onBuy: (biz: any) => void;
  onPayMaintenance: (bizId: string, type: 'electricity' | 'repair') => void;
  onHireManager: () => void;
}

export const BusinessCenterModal: React.FC<BusinessCenterModalProps> = ({
  isOpen,
  onClose,
  rubBalance,
  ownedBusinesses,
  businessMaintenance,
  totalIncome,
  managerHired,
  onBuy,
  onPayMaintenance,
  onHireManager,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'owned'>('all');

  if (!isOpen) return null;

  const availableBusinesses = BUSINESSES;
  const myBusinesses = ownedBusinesses;

  const getMaintenanceStatus = (bizId: string) => {
    const maint = businessMaintenance[bizId] || { electricity: 0, repair: 0 };
    const now = Date.now();
    const elecHours = Math.floor((now - maint.electricity) / 1000 / 3600);
    const repairDays = Math.floor((now - maint.repair) / 1000 / 3600 / 24);
    return { elecHours, repairDays, elecRemaining: 36 - elecHours, repairRemaining: 7 - repairDays };
  };

  const formatTime = (hours: number) => {
    if (hours < 24) return `${Math.floor(hours)}ч`;
    const days = Math.floor(hours / 24);
    return `${days}дн`;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}>
          <X size={24} color="#9ca3af" />
        </button>

        <h2 style={styles.title}>🏢 Бизнес Центр</h2>

        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('all')}
            style={activeTab === 'all' ? styles.tabActive : styles.tab}
          >
            Все бизнесы
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            style={activeTab === 'owned' ? styles.tabActive : styles.tab}
          >
            Мои ({myBusinesses.length})
          </button>
        </div>

        {activeTab === 'all' && (
          <div style={styles.businessList}>
            {availableBusinesses.map(biz => {
              const isOwned = myBusinesses.some(b => b.id === biz.id);
              const canAfford = rubBalance >= biz.price;

              return (
                <div key={biz.id} style={styles.businessCard}>
                  <div style={styles.businessHeader}>
                    <div style={styles.businessIcon}>
                      <TrendingUp size={24} color="#22c55e" />
                    </div>
                    <div style={styles.businessInfo}>
                      <h3 style={styles.businessName}>{biz.name}</h3>
                      <p style={styles.businessDesc}>{biz.description}</p>
                    </div>
                  </div>

                  <div style={styles.businessStats}>
                    <div style={styles.stat}>
                      <Zap size={16} color="#fbbf24" />
                      <span style={styles.statText}>+{biz.incomePerHour.toLocaleString()} ₽/час</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statText}>Цена: {biz.price.toLocaleString()} ₽</span>
                    </div>
                  </div>

                  {isOwned ? (
                    <button disabled style={styles.ownedBtn}>
                      ✓ Куплено
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuy(biz)}
                      disabled={!canAfford}
                      style={canAfford ? styles.buyBtn : styles.buyBtnDisabled}
                    >
                      {canAfford ? 'Купить' : 'Недостаточно ₽'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'owned' && (
          <div style={styles.myBusinessList}>
            {myBusinesses.length === 0 ? (
              <div style={styles.emptyState}>
                <AlertCircle size={48} color="#737373" />
                <p style={styles.emptyText}>У вас пока нет бизнесов</p>
                <button onClick={() => setActiveTab('all')} style={styles.browseBtn}>
                  Посмотреть доступные
                </button>
              </div>
            ) : (
              myBusinesses.map((biz, index) => {
                const conf = BUSINESSES.find(b => b.id === biz.id);
                const maint = getMaintenanceStatus(biz.id);

                return (
                  <div key={index} style={styles.myBusinessCard}>
                    <div style={styles.myBusinessHeader}>
                      <div style={styles.businessIcon}>
                        <TrendingUp size={20} color="#22c55e" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.myBusinessName}>{conf?.name || biz.id}</h4>
                        <p style={styles.myBusinessIncome}>
                          +{conf?.incomePerHour.toLocaleString() || 0} ₽/час
                        </p>
                      </div>
                    </div>

                    <div style={styles.maintenance}>
                      <div style={styles.maintenanceItem}>
                        <Clock size={14} color={maint.elecRemaining > 12 ? '#22c55e' : '#ef4444'} />
                        <span style={styles.maintenanceText}>
                          Электричество: {formatTime(maint.elecRemaining)}
                        </span>
                        {maint.elecRemaining < 12 && (
                          <button
                            onClick={() => onPayMaintenance(biz.id, 'electricity')}
                            style={styles.maintenanceBtn}
                          >
                            Оплатить
                          </button>
                        )}
                      </div>
                      <div style={styles.maintenanceItem}>
                        <Clock size={14} color={maint.repairRemaining > 3 ? '#22c55e' : '#ef4444'} />
                        <span style={styles.maintenanceText}>
                          Ремонт: {formatTime(maint.repairRemaining * 24)}
                        </span>
                        {maint.repairRemaining < 3 && (
                          <button
                            onClick={() => onPayMaintenance(biz.id, 'repair')}
                            style={styles.maintenanceBtn}
                          >
                            Починить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!managerHired && (
          <div style={styles.managerSection}>
            <h3 style={styles.managerTitle}>👔 Нанять менеджера</h3>
            <p style={styles.managerDesc}>
              Менеджер будет автоматически оплачивать обслуживание бизнесов
            </p>
            <button onClick={onHireManager} style={styles.hireManagerBtn}>
              Нанять за 15000 ₽
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Всего бизнесов:</span>
            <span style={styles.footerValue}>{myBusinesses.length}</span>
          </div>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Доход в час:</span>
            <span style={{ ...styles.footerValue, color: '#22c55e' }}>
              {totalIncome.toLocaleString()} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
  },
  modal: {
    background: '#141414',
    border: '1px solid rgba(156,163,175,0.15)',
    borderRadius: 20,
    padding: 24,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    background: '#262626',
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: '#737373',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
  },
  businessList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  businessCard: {
    background: 'rgba(38, 38, 38, 0.6)',
    border: '1px solid rgba(156, 163, 175, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  businessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  businessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(34, 197, 94, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    margin: 0,
  },
  businessDesc: {
    fontSize: 12,
    color: '#737373',
    margin: '4px 0 0 0',
  },
  businessStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  statText: {
    color: '#a3a3a3',
  },
  buyBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 14,
  },
  buyBtnDisabled: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(156, 163, 175, 0.2)',
    color: '#737373',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: 14,
  },
  ownedBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    fontWeight: 'bold',
    cursor: 'default',
    fontSize: 14,
  },
  myBusinessList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  myBusinessCard: {
    background: 'rgba(38, 38, 38, 0.6)',
    border: '1px solid rgba(156, 163, 175, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  myBusinessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  myBusinessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  myBusinessIncome: {
    fontSize: 12,
    color: '#22c55e',
    margin: '2px 0 0 0',
    fontWeight: '600',
  },
  maintenance: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid rgba(156, 163, 175, 0.1)',
  },
  maintenanceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  },
  maintenanceText: {
    color: '#a3a3a3',
    flex: 1,
  },
  maintenanceBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#737373',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 20,
  },
  browseBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  managerSection: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  managerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 8px 0',
  },
  managerDesc: {
    fontSize: 12,
    color: '#a3a3a3',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  hireManagerBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: 8,
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '1px solid rgba(156, 163, 175, 0.15)',
    marginTop: 16,
  },
  footerItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: '#737373',
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
};