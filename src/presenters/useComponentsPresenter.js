import { useState } from 'react';
import { THEME_PALETTE, MOCK_TABLE_USERS } from '../models/ComponentShowcaseModel';

/**
 * useComponentsPresenter - Presenter Layer (MVP)
 * Controls interactive states for UI components showcase.
 */
export function useComponentsPresenter() {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [demoInput, setDemoInput] = useState('Proapps Cloud Engine');
  const [selectedTag, setSelectedTag] = useState('all');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const simulateAsyncAction = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      showToast('Action processed successfully with #053079 & #09B2FF theme!');
    }, 1200);
  };

  return {
    palette: THEME_PALETTE,
    tableUsers: MOCK_TABLE_USERS,
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    toastMessage,
    showToast,
    buttonLoading,
    simulateAsyncAction,
    demoInput,
    setDemoInput,
    selectedTag,
    setSelectedTag
  };
}
