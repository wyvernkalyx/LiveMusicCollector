import React from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Music,
  Download,
  Search,
  Settings,
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Disc,
  Mic,
  Star,
  Clock,
  Menu,
  Edit3
} from 'lucide-react';
import Player from './Player';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${theme.colors.background.primary};
`;

const Sidebar = styled.nav`
  width: ${props => props.collapsed ? '60px' : '250px'};
  background: ${theme.colors.background.secondary};
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${theme.colors.border};
  transition: width 0.3s ease;
`;

const SidebarHeader = styled.div`
  padding: ${props => props.collapsed ? theme.spacing.sm : theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'};

  h1 {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 600;
    display: ${props => props.collapsed ? 'none' : 'flex'};
    align-items: center;
    gap: ${theme.spacing.sm};
  }

  button {
    background: transparent;
    border: none;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;

    &:hover {
      background: ${theme.colors.background.surface};
      color: ${theme.colors.text.primary};
    }
  }
`;

const NavSection = styled.div`
  padding: ${theme.spacing.md} 0;
`;

const NavItem = styled.button`
  width: 100%;
  padding: ${props => props.collapsed ? theme.spacing.md : `${theme.spacing.sm} ${theme.spacing.lg}`};
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  gap: ${theme.spacing.sm};
  color: ${props => props.active ? theme.colors.text.primary : theme.colors.text.secondary};
  background: ${props => props.active ? theme.colors.background.surface : 'transparent'};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.surface};
    color: ${theme.colors.text.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }

  span {
    flex: 1;
    text-align: left;
    display: ${props => props.collapsed ? 'none' : 'block'};
  }

  .count {
    font-size: ${theme.typography.fontSize.xs};
    color: ${theme.colors.text.disabled};
    display: ${props => props.collapsed ? 'none' : 'inline'};
  }
`;

const TreeItem = styled.div`
  padding: ${theme.spacing.xs} ${theme.spacing.lg} ${theme.spacing.xs} ${props => `${theme.spacing.lg + props.level * 20}px`};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  cursor: pointer;
  color: ${theme.colors.text.secondary};
  
  &:hover {
    background: ${theme.colors.background.surface};
    color: ${theme.colors.text.primary};
  }
  
  svg {
    width: 14px;
    height: 14px;
    transition: transform ${theme.transitions.fast};
    transform: ${props => props.expanded ? 'rotate(90deg)' : 'rotate(0)'};
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.lg};
`;

const StatusBar = styled.div`
  height: 32px;
  background: ${theme.colors.background.secondary};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing.md};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  gap: ${theme.spacing.md};
  
  span {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
`;

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, currentView, setView } = useStore();
  const [expandedYears, setExpandedYears] = React.useState(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navItems = [
    { path: '/', label: 'All Shows', icon: Music, count: stats.totalShows },
    { path: '/import', label: 'Import Music', icon: Download },
    { path: '/metadata-editor', label: 'Metadata Editor', icon: Edit3 },
    { path: '/search', label: 'Advanced Search', icon: Search },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const libraryViews = [
    { id: 'year', label: 'By Year', icon: Calendar },
    { id: 'venue', label: 'By Venue', icon: MapPin },
    { id: 'official', label: 'Official Releases', icon: Disc },
    { id: 'soundboard', label: 'Soundboards', icon: Mic },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recently Added', icon: Clock },
  ];

  const toggleYear = (year) => {
    const expanded = new Set(expandedYears);
    if (expanded.has(year)) {
      expanded.delete(year);
    } else {
      expanded.add(year);
    }
    setExpandedYears(expanded);
  };

  return (
    <LayoutContainer>
      <Sidebar collapsed={sidebarCollapsed}>
        <SidebarHeader collapsed={sidebarCollapsed}>
          <h1>
            <Music />
            Live Music Collector
          </h1>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </SidebarHeader>
        
        <NavSection>
          {navItems.map(item => (
            <NavItem
              key={item.path}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              collapsed={sidebarCollapsed}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.count && <span className="count">({item.count})</span>}
            </NavItem>
          ))}
        </NavSection>
        
        {!sidebarCollapsed && (
          <div style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            color: theme.colors.text.disabled,
            fontSize: theme.typography.fontSize.xs,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginTop: theme.spacing.md
          }}>
            Library Views
          </div>
        )}

        {libraryViews.map(view => (
          <NavItem
            key={view.id}
            active={location.pathname === '/' && currentView === view.id}
            onClick={() => {
              setView(view.id);
              navigate('/');
            }}
            collapsed={sidebarCollapsed}
            title={sidebarCollapsed ? view.label : ''}
          >
            <view.icon />
            <span>{view.label}</span>
          </NavItem>
        ))}

        {location.pathname === '/' && currentView === 'year' && stats.yearStats.length > 0 && (
          <div style={{ marginTop: theme.spacing.sm }}>
            {stats.yearStats.map(yearStat => (
              <div key={yearStat.year}>
                <TreeItem
                  level={1}
                  expanded={expandedYears.has(yearStat.year)}
                  onClick={() => toggleYear(yearStat.year)}
                >
                  <ChevronRight />
                  <span>{yearStat.year}</span>
                  <span className="count">({yearStat.show_count})</span>
                </TreeItem>
              </div>
            ))}
          </div>
        )}
      </Sidebar>
      
      <MainContent>
        <Player />
        <ContentArea>
          {children}
        </ContentArea>
        <StatusBar>
          <span>{stats.totalShows} shows</span>
          <span>•</span>
          <span>{stats.totalTracks} tracks</span>
          <span>•</span>
          <span>{stats.totalSize}</span>
        </StatusBar>
      </MainContent>
    </LayoutContainer>
  );
}

export default Layout;