import React from 'react';
import styled from 'styled-components';
import { useAppSelector, useAppDispatch } from '../../../store';
import { closeModal, ModalProps } from '../../../store/slices/uiSlice';
import { getThemeValue } from '../../theme/helpers';

const ModalBackdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: ${props => getThemeValue(props.theme, 'background.overlay', 'rgba(0, 0, 0, 0.5)')};
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ModalPanel = styled.div`
  background-color: ${props => getThemeValue(props.theme, 'background.elevated', '#FFFFFF')};
  border-radius: 8px;
  box-shadow: ${props => getThemeValue(props.theme, 'shadow.lg', '0 10px 15px rgba(0, 0, 0, 0.1)')};
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => getThemeValue(props.theme, 'border.default', '#DEE2E6')};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: ${props => getThemeValue(props.theme, 'text.primary', '#212529')};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${props => getThemeValue(props.theme, 'text.secondary', '#495057')};
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem;
  
  &:hover {
    color: ${props => getThemeValue(props.theme, 'text.primary', '#212529')};
  }
`;

const ModalContent = styled.div`
  padding: 1rem;
  overflow-y: auto;
  max-height: calc(90vh - 120px); /* adjust for header and footer if present */
`;

const ModalFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid ${props => getThemeValue(props.theme, 'border.default', '#DEE2E6')};
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

/**
 * Container for all modals in the application
 * Handles modal showing/hiding and backdrop
 */
const ModalContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, modalType, modalProps } = useAppSelector(state => state.ui.modal);
  
  // Type cast modalProps to our defined interface
  const typedModalProps = modalProps as ModalProps | undefined;
  
  const handleClose = () => {
    dispatch(closeModal());
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if the backdrop itself was clicked, not the modal content
    if (e.currentTarget === e.target) {
      handleClose();
    }
  };
  
  // We'll implement specific modal components later
  // For now, just show placeholder content
  const renderModalContent = () => {
    switch (modalType) {
      case 'settings':
        return <div>Settings Modal Content</div>;
      case 'newGame':
        return <div>New Game Modal Content</div>;
      case 'loadGame':
        return <div>Load Game Modal Content</div>;
      case 'confirm':
        return typedModalProps?.message ? (
          <div>Confirmation Modal: {typedModalProps.message}</div>
        ) : (
          <div>Confirmation Modal</div>
        );
      default:
        return <div>Unknown Modal Type</div>;
    }
  };
  
  return (
    <ModalBackdrop isOpen={isOpen} onClick={handleBackdropClick}>
      {isOpen && (
        <ModalPanel>
          <ModalHeader>
            <ModalTitle>{typedModalProps?.title || 'Modal'}</ModalTitle>
            <CloseButton onClick={handleClose}>×</CloseButton>
          </ModalHeader>
          
          <ModalContent>
            {renderModalContent()}
          </ModalContent>
          
          {typedModalProps?.showFooter && (
            <ModalFooter>
              {typedModalProps.showCancel && (
                <button onClick={handleClose}>Cancel</button>
              )}
              <button onClick={handleClose}>OK</button>
            </ModalFooter>
          )}
        </ModalPanel>
      )}
    </ModalBackdrop>
  );
};

export default ModalContainer;
