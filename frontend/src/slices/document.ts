import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import { Document } from '../models/owns/document';
import api from '../utils/api';
import { revertAll } from 'src/utils/redux';

interface DocumentState {
  documentsByEntity: Record<string, Document[]>;
  selectedDocument: Document | null;
  loadingGet: boolean;
}

const initialState: DocumentState = {
  documentsByEntity: {},
  selectedDocument: null,
  loadingGet: false
};

const slice = createSlice({
  name: 'documents',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getDocuments(
      state: DocumentState,
      action: PayloadAction<{ key: string; documents: Document[] }>
    ) {
      const { key, documents } = action.payload;
      state.documentsByEntity[key] = documents;
    },
    addDocument(
      state: DocumentState,
      action: PayloadAction<{ key: string; document: Document }>
    ) {
      const { key, document } = action.payload;
      if (!state.documentsByEntity[key]) {
        state.documentsByEntity[key] = [];
      }
      state.documentsByEntity[key] = [...state.documentsByEntity[key], document];
    },
    editDocument(
      state: DocumentState,
      action: PayloadAction<{ key: string; document: Document }>
    ) {
      const { key, document } = action.payload;
      if (!state.documentsByEntity[key]) {
        state.documentsByEntity[key] = [];
      }
      const documentIndex = state.documentsByEntity[key].findIndex(
        (doc) => doc.id === document.id
      );
      if (documentIndex === -1) {
        state.documentsByEntity[key] = [...state.documentsByEntity[key], document];
      } else {
        state.documentsByEntity[key][documentIndex] = document;
      }
    },
    deleteDocument(
      state: DocumentState,
      action: PayloadAction<{ key: string; id: number }>
    ) {
      const { key, id } = action.payload;
      if (!state.documentsByEntity[key]) return;
      
      const documentIndex = state.documentsByEntity[key].findIndex(
        (document) => document.id === id
      );
      if (documentIndex !== -1) {
        state.documentsByEntity[key].splice(documentIndex, 1);
      }
    },
    setSelectedDocument(
      state: DocumentState,
      action: PayloadAction<{ document: Document | null }>
    ) {
      const { document } = action.payload;
      state.selectedDocument = document;
    },
    setLoadingGet(
      state: DocumentState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    }
  }
});

export const reducer = slice.reducer;

export const getDocumentTree =
  (entityType: string, entityId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      console.log(`[DEBUG] Fetching documents for ${entityType}/${entityId}`);
      const documents = await api.get<Document[]>(`documents/tree/${entityType}/${entityId}`);
      console.log('[DEBUG] Documents received:', documents);
      const key = `${entityType}-${entityId}`;
      dispatch(slice.actions.getDocuments({ key, documents }));
      console.log('[DEBUG] Documents dispatched to store');
    } catch (error) {
      console.error('[ERROR] Error fetching documents:', error);
      console.error('[ERROR] Error details:', JSON.stringify(error));
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getDocumentById =
  (id: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const document = await api.get<Document>(`documents/${id}`);
      dispatch(slice.actions.setSelectedDocument({ document }));
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const createDocument =
  (
    entityType: string,
    entityId: number,
    data: {
      name: string;
      description?: string;
      parentDocumentId?: number;
      isFolder: boolean;
      tags?: string[];
    },
    file?: File
  ): AppThunk =>
  async (dispatch) => {
    try {
      const formData = new FormData();
      
      const documentData = {
        name: data.name,
        description: data.description,
        parentDocumentId: data.parentDocumentId,
        isFolder: data.isFolder,
        entityType: entityType,
        entityId: entityId,
        tags: data.tags
      };
      
      formData.append(
        'document',
        new Blob([JSON.stringify(documentData)], { type: 'application/json' })
      );
      
      if (file) {
        formData.append('file', file);
      }
      
      // Don't set Content-Type for FormData - browser will set it with boundary
      const document = await api.post<Document>('documents', formData);
      
      const key = `${entityType}-${entityId}`;
      dispatch(slice.actions.addDocument({ key, document }));
      
      // Refresh tree to get updated structure
      dispatch(getDocumentTree(entityType, entityId));
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  };

export const updateDocument =
  (
    id: number,
    entityType: string,
    entityId: number,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): AppThunk =>
  async (dispatch) => {
    try {
      const document = await api.patch<Document>(`documents/${id}`, data);
      const key = `${entityType}-${entityId}`;
      dispatch(slice.actions.editDocument({ key, document }));
      
      // Refresh tree to get updated structure
      dispatch(getDocumentTree(entityType, entityId));
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

export const deleteDocument =
  (id: number, entityType: string, entityId: number): AppThunk =>
  async (dispatch) => {
    try {
      await api.deletes(`documents/${id}`);
      const key = `${entityType}-${entityId}`;
      dispatch(slice.actions.deleteDocument({ key, id }));
      
      // Refresh tree to get updated structure
      dispatch(getDocumentTree(entityType, entityId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

export const downloadDocument = async (id: number): Promise<void> => {
  try {
    const response = await api.get<Response>(`documents/download/${id}`, {
      raw: true
    });
    
    // Get blob from response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'document';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

export default slice;
