'use client'

import Image from 'next/image';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {useState, useEffect, useRef} from 'react';
import {RedoIcon, ChevronLeftIcon, ChevronRightIcon, Download, X, ZoomIn} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {getBlobs, BlobInfo} from "@/services/azureClient";

// Add Modal component
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from '@radix-ui/react-dialog';

const containerOptions = [
  {label: 'Basic Version', value: 'bird-watcher-v1-basic'},
  {label: 'Pro Version', value: 'bird-watcher-v1-pro'},
];

async function fetchImages(containerName: string): Promise<BlobInfo[]> {
  try {
    // Calculate optimal image size based on viewport
    
    // Pass this to your API to get appropriately sized images
    return await getBlobs(containerName);
  } catch (error) {
    console.error("Failed to fetch blobs:", error);
    return [];
  }
}

// Add a function to add cache-busting parameter to image URLs
function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

export default function Home() {
  const [selectedContainer, setSelectedContainer] = useState(containerOptions[0].value);
  const [images, setImages] = useState<BlobInfo[]>([]);
  const [allImages, setAllImages] = useState<BlobInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 6;
  
  // Modal state for expanded view
  const [expandedImage, setExpandedImage] = useState<BlobInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Ref to track if we're currently loading a new page
  const isLoadingNewPage = useRef(false);
  
  // Ref to store the current container name
  const currentContainerRef = useRef(selectedContainer);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      isLoadingNewPage.current = true;
      currentContainerRef.current = selectedContainer;
      
      try {
        // Fetch all images
        const fetchedImages = await fetchImages(selectedContainer);
        
        // Sort images by date
        const sortedImages = fetchedImages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Store all images for background loading
        setAllImages(sortedImages);
        
        // Calculate current page images
        const startIndex = 0;
        const endIndex = imagesPerPage;
        const initialImages = sortedImages.slice(startIndex, endIndex);
        
        // Set current page images first for immediate display
        setImages(initialImages);
        setCurrentPage(1);
        
        // Preload next page images
        if (sortedImages.length > imagesPerPage) {
          const nextPageImages = sortedImages.slice(imagesPerPage, imagesPerPage * 2);
          nextPageImages.forEach(image => {
            const img = new window.Image();
            img.src = image.url;
          });
        }
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setLoading(false);
        isLoadingNewPage.current = false;
      }
    };

    loadImages();
  }, [selectedContainer]);

  const handleVersionSelect = (containerValue: string) => {
    setSelectedContainer(containerValue);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(allImages.length / imagesPerPage);
  
  // Navigation functions with content prioritization
  const goToNextPage = async () => {
    if (currentPage < totalPages && !isLoadingNewPage.current) {
      isLoadingNewPage.current = true;
      setLoading(true);
      
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Calculate indices for the next page
      const startIndex = (nextPage - 1) * imagesPerPage;
      const endIndex = startIndex + imagesPerPage;
      
      // Get images for the next page
      const nextPageImages = allImages.slice(startIndex, endIndex);
      
      // Update images with next page content
      setImages(nextPageImages);
      
      // Preload images for the page after next if it exists
      if (nextPage < totalPages) {
        const preloadStartIndex = endIndex;
        const preloadEndIndex = preloadStartIndex + imagesPerPage;
        const preloadImages = allImages.slice(preloadStartIndex, preloadEndIndex);
        
        preloadImages.forEach(image => {
          const img = new window.Image();
          img.src = image.url;
        });
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Short delay to ensure UI updates
      setTimeout(() => {
        setLoading(false);
        isLoadingNewPage.current = false;
      }, 300);
    }
  };

  const goToPreviousPage = async () => {
    if (currentPage > 1 && !isLoadingNewPage.current) {
      isLoadingNewPage.current = true;
      setLoading(true);
      
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      
      // Calculate indices for the previous page
      const startIndex = (prevPage - 1) * imagesPerPage;
      const endIndex = startIndex + imagesPerPage;
      
      // Get images for the previous page
      const prevPageImages = allImages.slice(startIndex, endIndex);
      
      // Update images with previous page content
      setImages(prevPageImages);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Short delay to ensure UI updates
      setTimeout(() => {
        setLoading(false);
        isLoadingNewPage.current = false;
      }, 300);
    }
  };
  
  // Handle image click for expanded view
  const handleImageClick = (image: BlobInfo) => {
    setExpandedImage(image);
    setModalOpen(true);
  };
  
  // Handle download image
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle reload images with cache busting
  const handleReloadImages = async () => {
    setLoading(true);
    
    try {
      // Force refetch with cache busting
      const fetchedImages = await fetchImages(selectedContainer);
      
      // Add cache busting to URLs
      const imagesWithCacheBusting = fetchedImages.map(img => ({
        ...img,
        url: addCacheBuster(img.url)
      }));
      
      // Sort images by date
      const sortedImages = imagesWithCacheBusting.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAllImages(sortedImages);
      
      // Calculate current page images
      const startIndex = (currentPage - 1) * imagesPerPage;
      const endIndex = startIndex + imagesPerPage;
      const currentPageImages = sortedImages.slice(startIndex, endIndex);
      
      setImages(currentPageImages);
    } catch (error) {
      console.error("Error reloading images:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">Bird Monitor Gallery</h1>
      
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 shadow-sm">
            {containerOptions.find(option => option.value === selectedContainer)?.label || "Select Version"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Select Version</DropdownMenuLabel>
            {containerOptions.map((option) => (
              <DropdownMenuItem key={option.value} onSelect={() => handleVersionSelect(option.value)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="outline" 
          disabled={loading} 
          onClick={handleReloadImages}
          className="border-teal-500 text-teal-500 hover:bg-teal-50"
        >
          {loading ? (
            <>
              <RedoIcon className="mr-2 h-4 w-4 animate-spin"/>
              Reloading...
            </>
          ) : (
            <>
              <RedoIcon className="mr-2 h-4 w-4"/>
              Reload Images
            </>
          )}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading images...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-500">No images found.</div>
            )}
            
            {images.map((image, index) => (
              <div 
                key={`${currentPage}-${index}-${image.url}`} 
                className="relative rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:shadow-lg hover:scale-[1.02] bg-white group"
                onClick={() => handleImageClick(image)}
              >
                <div className="relative aspect-w-16 aspect-h-9 bg-slate-200 animate-pulse">
                  <Image
                    src={image.url}
                    alt={`Image ${index}`}
                    width={500}
                    height={300}
                    loading={index < 3 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                    key={`img-${currentPage}-${index}-${image.url}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onLoadingComplete={(img) => {
                      // Remove placeholder effect when image loads
                      if (img.parentElement) {
                        img.parentElement.classList.remove('animate-pulse', 'bg-slate-200');
                      }
                    }}
                    onError={(e) => {
                      // Handle image loading error
                      const target = e.target as HTMLImageElement;
                      if (target.parentElement) {
                        target.parentElement.classList.remove('animate-pulse');
                        target.parentElement.classList.add('bg-red-100');
                      }
                    }}
                  />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-sm transition-opacity">
                  {new Date(image.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-full p-2">
                    <ZoomIn className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {allImages.length > 0 && (
            <div className="flex justify-center items-center mt-10 mb-6 space-x-4">
              <Button 
                variant="outline" 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1 || loading}
                className="flex items-center border-teal-400 text-teal-600 hover:bg-teal-50"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm font-medium px-4 py-2 bg-white rounded-md shadow-sm">
                Page {currentPage} of {totalPages} <span className="text-slate-500">({allImages.length} images)</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || allImages.length === 0 || loading}
                className="flex items-center border-teal-400 text-teal-600 hover:bg-teal-50"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {/* Expanded Image Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-none w-screen h-screen p-0 bg-slate-900 m-0 rounded-none border-0">
              <DialogTitle className="sr-only">Expanded Image</DialogTitle>
              <DialogClose className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
                <X className="h-5 w-5" />
              </DialogClose>
              
              {expandedImage && (
                <div className="flex flex-col h-full w-full">
                  <div className="flex-1 relative w-full h-full flex items-center justify-center">
                    {/* Loading indicator for expanded image */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900" id="loading-indicator">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-white">Loading high-resolution image...</p>
                      </div>
                    </div>
                    
                    {/* Use regular img tag instead of Next.js Image for better fullscreen support */}
                    <img
                      src={expandedImage.url}
                      alt="Expanded view"
                      className="max-h-[calc(100vh-64px)] max-w-full w-auto h-auto object-contain"
                      onLoad={() => {
                        // Hide loading indicator when image loads
                        const loadingIndicator = document.getElementById('loading-indicator');
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                      }}
                      onError={(e) => {
                        // Hide loading indicator even on error
                        const loadingIndicator = document.getElementById('loading-indicator');
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                        // Show error message
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                        e.currentTarget.style.width = '64px';
                        e.currentTarget.style.height = '64px';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                    />
                  </div>
                  
                  <div className="bg-black/60 p-4 flex justify-between items-center">
                    <div className="text-white">
                      {expandedImage.createdAt && new Date(expandedImage.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                      })}
                    </div>
                    
                    <Button 
                      onClick={() => handleDownload(expandedImage.url, expandedImage.name || 'image.jpg')}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
