import { Link, router, usePage } from "@inertiajs/react";
import { CheckIcon, PlusIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";

import NotificationMenu from "@/components/navbar-components/notification-menu";
import ThemeToggle from "@/components/navbar-components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { index as blogsIndex, create as blogsCreate } from "@/routes/blogs";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Author {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
}

interface BlogFilters {
  search?: string;
  tags?: string[];
  author?: string;
  organization?: string;
}

interface NavbarProps {
  breadcrumbs?: BreadcrumbItemType[];
  showSearch?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Navbar({ breadcrumbs = [], showSearch = false }: NavbarProps) {
  const searchId = useId();
  const { props } = usePage<{ tags?: Tag[]; organizations?: Organization[]; filters?: BlogFilters }>();
  const tags = props.tags ?? [];
  const organizations = props.organizations ?? [];
  const filters = props.filters ?? {};

  const [search, setSearch] = useState(filters.search ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags ?? []);
  const [selectedOrg, setSelectedOrg] = useState(filters.organization ?? "");
  const [selectedAuthorId, setSelectedAuthorId] = useState(filters.author ?? "");
  const [selectedAuthorName, setSelectedAuthorName] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [authorSuggestions, setAuthorSuggestions] = useState<Author[]>([]);
  const [authorPage, setAuthorPage] = useState(1);
  const [authorHasMore, setAuthorHasMore] = useState(false);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debouncedAuthorSearch = useDebounce(authorSearch, 300);

  // Sync local state when Inertia navigates
  useEffect(() => {
    setSearch(filters.search ?? "");
    setSelectedTags(filters.tags ?? []);
    setSelectedOrg(filters.organization ?? "");
    setSelectedAuthorId(filters.author ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.author, filters.organization, JSON.stringify(filters.tags)]);

  // Fetch authors
  const fetchAuthors = useCallback(async (query: string, page: number, append: boolean) => {
    setAuthorLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) {
        params.set("search", query);
      }
      const res = await fetch(`/blogs/authors?${params}`);
      const data = await res.json();
      setAuthorSuggestions((prev) => (append ? [...prev, ...data.data] : data.data));
      setAuthorPage(page);
      setAuthorHasMore(data.current_page < data.last_page);
    } finally {
      setAuthorLoading(false);
    }
  }, []);

  // Re-fetch when search term changes
  useEffect(() => {
    fetchAuthors(debouncedAuthorSearch, 1, false);
  }, [debouncedAuthorSearch, fetchAuthors]);

  // Load author name on open if we already have a selected author
  useEffect(() => {
    if (open && filters.author && !selectedAuthorName) {
      fetch(`/blogs/authors?search=&page=1`).then((r) => r.json()).then((data) => {
        const found = (data.data as Author[]).find((a) => String(a.id) === filters.author);
        if (found) {
          setSelectedAuthorName(`${found.first_name} ${found.last_name}`);
        }
      });
    }
  }, [open, filters.author, selectedAuthorName]);

  // Horizontal infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && authorHasMore && !authorLoading) {
          fetchAuthors(debouncedAuthorSearch, authorPage + 1, true);
        }
      },
      { root: container, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [authorHasMore, authorLoading, authorPage, debouncedAuthorSearch, fetchAuthors]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const applyFilters = () => {
    router.get(
      blogsIndex().url,
      {
        ...(search && { search }),
        ...(selectedTags.length && { tags: selectedTags }),
        ...(selectedAuthorId && { author: selectedAuthorId }),
        ...(selectedOrg && { organization: selectedOrg }),
      },
      { preserveState: false },
    );
    setOpen(false);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setSelectedOrg("");
    setSelectedAuthorId("");
    setSelectedAuthorName("");
    setAuthorSearch("");
    router.get(blogsIndex().url, {}, { preserveState: false });
    setOpen(false);
  };

  const activeFilterCount = selectedTags.length + (selectedAuthorId ? 1 : 0) + (selectedOrg ? 1 : 0);

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side - sidebar toggle + breadcrumbs */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1 shrink-0" />
          {breadcrumbs.length > 0 && (
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <Fragment key={item.href}>
                      <BreadcrumbItem className={isLast ? "min-w-0" : "shrink-0"}>
                        {isLast ? (
                          <BreadcrumbPage className="block max-w-[200px] truncate sm:max-w-xs">{item.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.title}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Middle - search (blogs only) */}
        {showSearch && (
          <div className="grow max-sm:hidden">
            <div className="relative mx-auto w-full max-w-xs">
              <Input
                className="peer h-8 ps-8 pe-8"
                id={searchId}
                placeholder="Search posts..."
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80">
                <SearchIcon aria-hidden="true" size={16} />
              </div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute inset-y-0 end-0 flex items-center pe-2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Filter options"
                  >
                    <div className="relative">
                      <SlidersHorizontalIcon
                        size={14}
                        aria-hidden="true"
                        className={activeFilterCount > 0 ? "text-primary" : ""}
                      />
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 flex size-4 items-center justify-center p-0 text-[9px]">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold">Filter posts</p>

                    {/* Tags - multi select */}
                    {tags.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Tags</label>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => {
                            const active = selectedTags.includes(tag.slug);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.slug)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                  active
                                    ? "border-transparent bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {active && <CheckIcon size={10} />}
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Author - search + horizontal scrollable avatars */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Author</label>
                      {selectedAuthorId ? (
                        <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[9px]">{getInitials(selectedAuthorName)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate text-xs">{selectedAuthorName}</span>
                          <button
                            type="button"
                            onClick={() => { setSelectedAuthorId(""); setSelectedAuthorName(""); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      ) : (
                        <Input
                          placeholder="Search authors..."
                          value={authorSearch}
                          onChange={(e) => setAuthorSearch(e.target.value)}
                          className="h-8"
                        />
                      )}
                      {!selectedAuthorId && (
                        <div
                          ref={scrollRef}
                          className="flex gap-2 overflow-x-auto pb-1"
                          style={{ scrollbarWidth: "none" }}
                        >
                          {authorSuggestions.map((author) => (
                            <button
                              key={author.id}
                              type="button"
                              onClick={() => {
                                setSelectedAuthorId(String(author.id));
                                setSelectedAuthorName(`${author.first_name} ${author.last_name}`);
                                setAuthorSearch("");
                              }}
                              className="flex shrink-0 flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-muted"
                            >
                              <Avatar className="size-9">
                                <AvatarFallback className="text-xs">{getInitials(`${author.first_name} ${author.last_name}`)}</AvatarFallback>
                              </Avatar>
                              <span className="w-12 truncate text-center text-[10px] leading-tight text-muted-foreground">{`${author.first_name} ${author.last_name}`}</span>
                            </button>
                          ))}
                          {authorHasMore && (
                            <div ref={sentinelRef} className="flex shrink-0 items-center px-2">
                              {authorLoading && (
                                <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                              )}
                            </div>
                          )}
                          {authorSuggestions.length === 0 && !authorLoading && (
                            <p className="py-2 text-xs text-muted-foreground">No authors found</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Organization */}
                    {organizations.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Organization</label>
                        <div className="flex flex-wrap gap-1.5">
                          {organizations.map((org) => {
                            const active = selectedOrg === org.slug;
                            return (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => setSelectedOrg(active ? "" : org.slug)}
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                  active
                                    ? "border-transparent bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {org.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
                        Clear
                      </Button>
                      <Button size="sm" className="flex-1" onClick={applyFilters}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button asChild className="text-sm max-sm:aspect-square max-sm:p-0" size="sm">
            <Link href={blogsCreate().url}>
              <PlusIcon aria-hidden="true" className="sm:-ms-1 opacity-60" size={16} />
              <span className="max-sm:sr-only">Post</span>
            </Link>
          </Button>
          <NotificationMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
