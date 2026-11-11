import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Modal } from '../ui/Modal';
import { ItemForm } from '../items/ItemForm';

export const AppLayout: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onAddItem={() => setIsAddModalOpen(true)}
          onSelectItem={id => navigate(`/items?id=${id}`)}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Global Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Tracked Item"
        description="Add a license, contract, subscription, or compliance record to Vigil"
        maxWidth="2xl"
      >
        <ItemForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
