import { useState } from 'react';

import type { CommunicationCampaign } from '../../../types/Communication';

import CampaignList from './CampaignList';
import CampaignEditor from './CampaignEditor';

import '../../../styles/communication.css';

type View =
    | 'list'
    | 'create'
    | 'edit';

export default function CommunicationCenter() {
    const [view, setView] =
        useState<View>('list');

    const [selectedCampaign, setSelectedCampaign] =
        useState<CommunicationCampaign | null>(null);

    function handleCreate() {
        setSelectedCampaign(null);
        setView('create');
    }

    function handleEdit(
        campaign: CommunicationCampaign
    ) {
        setSelectedCampaign(campaign);
        setView('edit');
    }

    function handleSaved() {
        setView('list');
        setSelectedCampaign(null);
    }

    function handleCancel() {
        setView('list');
        setSelectedCampaign(null);
    }

    if (view === 'create') {
        return (
            <CampaignEditor
                onSaved={handleSaved}
                onCancel={handleCancel}
            />
        );
    }

    if (view === 'edit') {
        return (
            <CampaignEditor
                campaign={selectedCampaign}
                onSaved={handleSaved}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div className="communication-center">

            <CampaignList
                onCreate={handleCreate}
                onEdit={handleEdit}
            />

        </div>
    );
}