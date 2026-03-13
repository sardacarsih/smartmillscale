import React, { useState, useEffect } from 'react';

const TBSBlockModal = ({ isOpen, onClose, onSubmit, blocks = [] }) => {
  const [blockData, setBlockData] = useState([]);

  useEffect(() => {
    // Initialize block data when modal opens
    if (isOpen) {
      const defaultBlocks = [
        { blok: 'A', janjang: '', berat: '' },
        { blok: 'B', janjang: '', berat: '' },
        { blok: 'C', janjang: '', berat: '' },
        { blok: 'D', janjang: '', berat: '' },
      ];

      // If there's existing data, use it
      if (blocks && blocks.length > 0) {
        const mergedData = defaultBlocks.map(defaultBlock => {
          const existing = blocks.find(b => b.blok === defaultBlock.blok);
          return existing || defaultBlock;
        });
        setBlockData(mergedData);
      } else {
        setBlockData(defaultBlocks);
      }
    }
  }, [isOpen, blocks]);

  const handleInputChange = (index, field, value) => {
    const newData = [...blockData];
    if (field === 'janjang') {
      newData[index][field] = value === '' ? '' : parseInt(value) || 0;
    } else if (field === 'berat') {
      newData[index][field] = value === '' ? '' : parseFloat(value) || 0;
    } else {
      newData[index][field] = value;
    }
    setBlockData(newData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all data
    const isValid = blockData.every(block =>
      block.janjang !== '' && block.berat !== '' && block.janjang >= 0 && block.berat >= 0
    );

    if (!isValid) {
      alert('Harap isi semua data blok dengan benar');
      return;
    }

    onSubmit(blockData);
    onClose();
  };

  const handleCancel = () => {
    setBlockData([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Data TBS per Blok</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {blockData.map((block, index) => (
              <div key={block.blok} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-lg mb-3 text-center text-gray-700">
                  Blok {block.blok}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Janjang
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={block.janjang}
                      onChange={(e) => handleInputChange(index, 'janjang', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Berat (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={block.berat}
                      onChange={(e) => handleInputChange(index, 'berat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TBSBlockModal;