import { useState } from 'react';
import { Row, Col, Empty, Spin, Input, Button, Space, Dropdown, Menu } from 'antd';
import { 
  PlusCircleOutlined, 
  SyncOutlined, 
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import PasswordCard from './PasswordCard';
import styles from '../styles/PasswordGrid.module.css';

const { Search } = Input;

const PasswordGrid = ({ 
  credentials, 
  allCount,        // total stored passwords (unfiltered)
  loading, 
  searchInput,
  onSearch,
  onSearchChange,
  onAdd,
  onRefresh,
  onEdit,
  onDelete
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('site');

  const sortOptions = [
    { key: 'site', label: 'Sort by Site' },
    { key: 'username', label: 'Sort by Username' },
    { key: 'recent', label: 'Recently Added' }
  ];

  const sortedCredentials = [...credentials].sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return a.username.localeCompare(b.username);
      case 'recent':
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      default:
        return a.site.localeCompare(b.site);
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
          <h2 className={styles.gridTitle}>My Passwords</h2>
          <span className={styles.credentialCount}>
            {searchInput
              ? `${credentials.length} of ${allCount ?? credentials.length} match`
              : `${credentials.length} password${credentials.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        
        <div className={styles.headerRight}>
          <Search
            placeholder="Search passwords..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            loading={loading}
            className={styles.searchInput}
            allowClear
          />
          
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
            icon={<PlusCircleOutlined />}
            onClick={onAdd}
            className={styles.addButton}
          >
            Add Password
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
            <p>Loading your passwords...</p>
          </div>
        ) : credentials.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className={styles.emptyState}>
                <h3>No passwords saved yet</h3>
                <p>Get started by adding your first password</p>
                <Button 
                  type="primary" 
                  icon={<PlusCircleOutlined />}
                  onClick={onAdd}
                  size="large"
                >
                  Add Your First Password
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
