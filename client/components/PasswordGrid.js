import { useState } from 'react';
import { Row, Col, Empty, Spin, Input, Button, Space, Dropdown, Menu, Select } from 'antd';
import { 
  PlusCircleOutlined, 
  SyncOutlined, 
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  SaveOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import PasswordCard from './PasswordCard';
import styles from '../styles/PasswordGrid.module.css';

const { Search } = Input;

const PasswordGrid = ({ 
  credentials, 
  allCount,
  loading, 
  searchInput,
  onSearch,
  onSearchChange,
  onAdd,
  onRefresh,
  onEdit,
  onDelete,
  categoryFilter,
  onCategoryChange,
  categories = [],
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('site');

  const sortOptions = [
    { key: 'site', label: 'Sort by Site' },
    { key: 'username', label: 'Sort by Username' },
    { key: 'recent', label: 'Recently Added' },
    { key: 'category', label: 'Sort by Category' },
  ];

  const sortedCredentials = [...credentials].sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return (a.username || '').localeCompare(b.username || '');
      case 'recent':
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      default:
        return (a.site || '').localeCompare(b.site || '');
    }
  });

  const handleSortChange = ({ key }) => {
    setSortBy(key);
  };

  const sortMenu = (
    <Menu onClick={handleSortChange} selectedKeys={[sortBy]}>
      {sortOptions.map(option => (
        <Menu.Item key={option.key}>
          {option.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={styles.passwordGrid}>
      <div className={styles.gridHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.gridTitle}>My Vault</h2>
          <span className={styles.credentialCount}>
            {searchInput || categoryFilter !== 'all'
              ? `${credentials.length} of ${allCount ?? credentials.length} match`
              : `${credentials.length} login${credentials.length !== 1 ? 's' : ''} saved`}
          </span>
        </div>
        
        <div className={styles.headerRight}>
          <Search
            placeholder="Search logins..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            loading={loading}
            className={styles.searchInput}
            allowClear
          />

          {/* Category filter */}
          {categories.length > 0 && (
            <Select
              value={categoryFilter || 'all'}
              onChange={onCategoryChange}
              className={styles.categorySelect}
              dropdownStyle={{ background: "#111827", border: "1px solid rgba(99,102,241,0.2)" }}
              suffixIcon={<FilterOutlined style={{ color: '#6366f1' }} />}
            >
              <Select.Option value="all">All Categories</Select.Option>
              {categories.map(cat => (
                <Select.Option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </Select.Option>
              ))}
            </Select>
          )}
          
          <Space.Compact>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
              className={styles.viewButton}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
              className={styles.viewButton}
            />
          </Space.Compact>
          
          <Dropdown overlay={sortMenu} trigger={['click']}>
            <Button icon={<SortAscendingOutlined />} className={styles.sortButton}>
              Sort
            </Button>
          </Dropdown>
          
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={onAdd}
            className={styles.addButton}
          >
            Save Login
          </Button>
          
          <Button 
            icon={<SyncOutlined className={loading ? 'spin' : ''} />}
            onClick={onRefresh}
            loading={loading}
            className={styles.refreshButton}
          />
        </div>
      </div>

      <div className={styles.gridContent}>
        {loading && credentials.length === 0 ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p>Loading your saved logins...</p>
          </div>
        ) : credentials.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className={styles.emptyState}>
                <h3>No logins saved yet</h3>
                <p>Store your first website login — encrypted and secure on the blockchain</p>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={onAdd}
                  size="large"
                >
                  Save Your First Login
                </Button>
              </div>
            }
          />
        ) : (
          <Row 
            gutter={[24, 24]} 
            className={`${styles.credentialsGrid} ${styles[viewMode]}`}
          >
            {sortedCredentials.map((credential) => (
              <Col 
                key={credential.id}
                xs={24}
                sm={viewMode === 'grid' ? 12 : 24}
                md={viewMode === 'grid' ? 12 : 24}
                lg={viewMode === 'grid' ? 8 : 24}
                xl={viewMode === 'grid' ? 6 : 24}
              >
                <PasswordCard
                  credential={credential}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  loading={loading}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default PasswordGrid;
