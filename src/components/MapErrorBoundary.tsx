import React from 'react';

interface MapErrorBoundaryState {
  errorKey: number;
  hasError: boolean;
}

// Leaflet occasionally throws during interrupted zoom/fly animations.
// Instead of letting one bad frame unmount the whole game, remount
// just the map subtree (markers rebuild from game state).
export class MapErrorBoundary extends React.Component<
  React.PropsWithChildren,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { errorKey: 0, hasError: false };

  static getDerivedStateFromError(): Partial<MapErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Map crashed, remounting it:', error);
    // Remount on the next frame with a fresh key
    requestAnimationFrame(() => {
      this.setState(s => ({ errorKey: s.errorKey + 1, hasError: false }));
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
        }}>
          RESYNCING CITY MAP...
        </div>
      );
    }
    return (
      <React.Fragment key={this.state.errorKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
