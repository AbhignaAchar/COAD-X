import React, { useState } from 'react';
import { GitFork, FileCode, Layers, CheckCircle2, AlertTriangle, Eye, Shield, HardDrive, Key, FileCheck, Calendar, Hash } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import StatusBadge from '../components/StatusBadge';

export default function EvidenceGraph() {
  const { caseId, evidenceFiles, fragments, reconstructedFiles, tamperAnalysisMap } = useForensic();
  const [selectedNode, setSelectedNode] = useState(null);

  const activeFile = evidenceFiles[0];
  const activeFragments = fragments.slice(0, 6);
  const activeRecon = reconstructedFiles[0];

  // Forensic Graph Nodes based on active investigation
  const forensicNodes = [
    {
      id: 'NODE-CASE',
      category: 'CASE',
      title: `Case: ${caseId}`,
      subtitle: 'Active Legal Inquest',
      status: 'Active',
      icon: Shield,
      color: 'border-[#0891B2] bg-[#ECFEFF] text-[#0891B2]'
    },
    {
      id: 'NODE-DEVICE',
      category: 'DEVICE',
      title: 'Target Storage Vol',
      subtitle: 'SATA / Flash Endpoint',
      status: 'Verified',
      icon: HardDrive,
      color: 'border-[#CBD5E1] bg-white text-[#0F172A]'
    },
    {
      id: activeFile ? activeFile.id : 'NODE-FILE',
      category: 'FILE',
      title: activeFile ? activeFile.name : 'No Evidence Ingested',
      subtitle: activeFile ? `${(activeFile.size / 1024).toFixed(1)} KB • ${activeFile.detectedType}` : 'Awaiting upload',
      status: activeFile ? activeFile.status : 'Pending',
      raw: activeFile,
      icon: FileCode,
      color: 'border-[#0891B2] bg-white text-[#0F172A]'
    },
    {
      id: 'NODE-FRAGS',
      category: 'FRAGMENT',
      title: `${fragments.length} Sector Blocks`,
      subtitle: '1024-Byte Extracted Chunks',
      status: fragments.length > 0 ? 'Extracted' : 'None',
      icon: Layers,
      color: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7]'
    },
    {
      id: activeRecon ? activeRecon.id : 'NODE-RECON',
      category: 'RECONSTRUCTED',
      title: activeRecon ? activeRecon.originalName : 'Reconstruction Job',
      subtitle: activeRecon ? `Status: ${activeRecon.status || 'Verified'}` : 'Pending reassembly',
      status: activeRecon ? (activeRecon.integrityStatus || 'Verified') : 'Pending',
      raw: activeRecon,
      icon: FileCheck,
      color: activeRecon ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]' : 'border-[#DCE5EF] bg-white text-[#64748B]'
    },
    {
      id: 'NODE-HASH',
      category: 'HASH',
      title: 'SHA-256 Digest',
      subtitle: activeFile && activeFile.hash ? `${activeFile.hash.substring(0, 12)}...` : 'Pending calculation',
      status: 'Cryptographic',
      icon: Key,
      color: 'border-[#DCE5EF] bg-white text-[#0F172A]'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Evidence & Fragment Dependency Graph</h2>
          <p className="text-xs text-[#64748B]">
            Structured relationship hierarchy connecting case origin, storage devices, files, byte fragments, and reconstructed hashes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#16A34A]"></span> Verified Chain
          </div>
          <div className="flex items-center gap-1.5 text-[#0891B2] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#0891B2]"></span> Ingest Dependency
          </div>
          <div className="flex items-center gap-1.5 text-[#D97706] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#D97706] border-b border-dashed"></span> Sector Ordering
          </div>
        </div>
      </div>

      {evidenceFiles.length === 0 ? (
        <div className="glass-panel p-10 text-center border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
          <GitFork className="w-12 h-12 mx-auto mb-3 text-[#94A3B8]" />
          <h4 className="text-sm font-bold text-[#0F172A]">No evidence nodes to render graph</h4>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Upload digital evidence or load built-in sample data to generate and explore the forensic dependency hierarchy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual Topology Canvas */}
          <div className="lg:col-span-2 glass-panel p-5 relative min-h-[460px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between z-10 mb-4">
              <span className="text-xs font-mono text-[#0891B2] font-bold">Forensic Dependency Flow</span>
              <span className="text-[11px] text-[#64748B]">Select any entity node to inspect metadata</span>
            </div>

            {/* Structured Dependency Progression Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-auto">
              {forensicNodes.map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-150 ${node.color} ${
                      isSelected ? 'ring-2 ring-[#0891B2] shadow-xs' : 'hover:border-[#0891B2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-80">
                        {node.category}
                      </span>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-[#0F172A] truncate mb-0.5">{node.title}</div>
                    <div className="text-[11px] text-[#64748B] truncate">{node.subtitle}</div>
                    <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#64748B]">Status:</span>
                      <span className="font-semibold text-[#0891B2]">{node.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Linear Chain Representation */}
            <div className="mt-4 pt-3 border-t border-[#DCE5EF] flex items-center justify-between text-[11px] text-[#64748B] font-mono overflow-x-auto gap-2">
              <span className="font-semibold text-[#0F172A]">CHAIN:</span>
              <span>CASE ({caseId})</span>
              <span>→</span>
              <span>DEVICE</span>
              <span>→</span>
              <span>{activeFile?.name || 'FILE'}</span>
              <span>→</span>
              <span>{fragments.length} FRAGMENTS</span>
              <span>→</span>
              <span>RECONSTRUCTION</span>
              <span>→</span>
              <span>SHA-256 HASH</span>
            </div>
          </div>

          {/* Node Inspector Panel */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#0891B2]" />
              Node Inspector Panel
            </h3>

            {!selectedNode ? (
              <div className="text-center py-12 text-[#64748B] text-xs">
                Click on any node in the forensic dependency map to view cryptographic properties, offsets, and relation links.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#DCE5EF] rounded-lg">
                  <div className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Node Category
                  </div>
                  <div className="text-sm font-bold text-[#0891B2]">
                    {selectedNode.category} Node
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Entity Title:</span>
                    <span className="font-semibold text-[#0F172A]">{selectedNode.title}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Subsystem Info:</span>
                    <span className="text-[#64748B]">{selectedNode.subtitle}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Status Verification:</span>
                    <span className="font-mono font-semibold text-[#16A34A]">{selectedNode.status}</span>
                  </div>
                </div>

                {selectedNode.raw && (
                  <div className="pt-3 border-t border-[#DCE5EF] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Raw Telemetry:</span>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#DCE5EF] rounded font-mono text-[10px] text-[#0F172A] overflow-x-auto space-y-1">
                      <div>ID: {selectedNode.raw.id}</div>
                      <div>Type: {selectedNode.raw.detectedType || selectedNode.raw.type || 'binary'}</div>
                      {selectedNode.raw.hash && <div className="truncate">Hash: {selectedNode.raw.hash}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
