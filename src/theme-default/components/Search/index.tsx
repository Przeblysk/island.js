import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { MatchResultItem, PageSearcher } from '../../logic/search';
import SearchSvg from './icons/search.svg';
import LoadingSvg from './icons/loading.svg';
import { ComponentPropsWithIsland } from '../../../shared/types/index';
import { throttle } from 'lodash-es';

function SuggestionContent(props: {
  suggestion: MatchResultItem;
  query: string;
}) {
  const { suggestion, query } = props;
  const renderHeaderMatch = () => {
    if (suggestion.type === 'header') {
      const { header, headerHighlightIndex } = suggestion;
      const headerPrefix = header.slice(0, headerHighlightIndex);
      const headerSuffix = header.slice(headerHighlightIndex + query.length);
      return (
        <div font="medium">
          <span>{headerPrefix}</span>
          <span bg="brand-light" p="y-0.4 x-0.8" rounded="md" text="text-1">
            {query}
          </span>
          <span>{headerSuffix}</span>
        </div>
      );
    } else {
      return <div font="medium">{suggestion.header}</div>;
    }
  };
  const renderStatementMatch = () => {
    if (suggestion.type !== 'content') {
      return;
    }
    const { statementHighlightIndex, statement } = suggestion;
    const statementPrefix = statement.slice(0, statementHighlightIndex);
    const statementSuffix = statement.slice(
      statementHighlightIndex + query.length
    );
    return (
      <div font="normal" text="sm gray-light" w="100%">
        <span>{statementPrefix}</span>
        <span bg="brand-light" p="y-0.4 x-0.8" rounded="md" text="[#000]">
          {query}
        </span>
        <span>{statementSuffix}</span>
      </div>
    );
  };
  return (
    <div
      border-1=""
      table-cell=""
      p="x-3 y-2"
      hover="bg-[#f3f4f5]"
      className="border-right-none"
      transition="bg duration-200"
    >
      <div font="medium" text="sm">
        {renderHeaderMatch()}
      </div>
      {suggestion.type === 'content' && renderStatementMatch()}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Search(
  props: ComponentPropsWithIsland & { langRoutePrefix: string }
) {
  const [suggestions, setSuggestions] = useState<MatchResultItem[]>([]);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const psRef = useRef<PageSearcher>();
  const initPageSearcherPromiseRef = useRef<Promise<void>>();
  const [initialized, setInitialized] = useState(false);
  const [searching, setSearching] = useState(false);
  // initializing or searching
  const showLoading = query.length > 0 && (!initialized || searching);
  // 1. user input query
  // 2. page searcher has been initialized and finish searching
  // 4. result is empty
  const showNotFound =
    query.length > 0 && !showLoading && suggestions.length === 0;
  console.log(showLoading);

  const initPageSearcher = useCallback(async () => {
    if (!psRef.current) {
      const { PageSearcher } = await import('../../logic/search');
      psRef.current = new PageSearcher(props.langRoutePrefix);
      await psRef.current.init();
      setInitialized(true);
    } else {
      return Promise.resolve();
    }
  }, [props.langRoutePrefix]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onQueryChanged = useCallback(
    throttle(async (e: ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);
      initPageSearcherPromiseRef.current =
        initPageSearcherPromiseRef.current || initPageSearcher();
      await initPageSearcherPromiseRef.current;
      setSearching(true);
      const matched = await psRef.current!.match(newQuery);
      setSearching(false);
      setSuggestions(matched);
    }, 200),
    [initPageSearcher]
  );
  return (
    <div flex="" items-center="~" relative="" mr="4" font="semibold">
      <SearchSvg w="5" h="5" fill="currentColor" />
      <input
        cursor="text focus:auto"
        w="40"
        placeholder="Search"
        height="8"
        border="none"
        type="text"
        text="sm"
        p="t-0 r-2 b-0 l-2"
        transition="all duration-200 ease"
        className="rounded-sm"
        aria-label="Search"
        autoComplete="off"
        onChange={onQueryChanged}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        onFocus={() => {
          setFocused(true);
          initPageSearcherPromiseRef.current = initPageSearcher();
        }}
      />
      {focused && query.length > 0 && (
        <ul
          absolute=""
          z="60"
          pos="top-8"
          border-1=""
          p="2"
          list="none"
          bg="bg-default"
          className="min-w-500px max-w-700px"
        >
          {/* Show the suggestions */}
          {suggestions.map((item) => (
            <li key={item.title} rounded="sm" cursor="pointer" w="100%">
              <a block="" href={item.link} className="whitespace-normal">
                <div table="" w="100%" className="border-collapse">
                  <div
                    w="35%"
                    border-1=""
                    border-left="none"
                    table-cell=""
                    align="middle right"
                    p="1.2"
                    text="sm right"
                    font="semibold"
                    className="bg-[#f5f5f5]"
                  >
                    {item.title}
                  </div>
                  <SuggestionContent suggestion={item} query={query} />
                </div>
              </a>
            </li>
          ))}
          {/* Show the not found info */}
          {showNotFound && (
            <li flex="center">
              <div p="2" text="sm gray-light">
                No results found
              </div>
            </li>
          )}
          {/* Show the loading info */}
          {showLoading && (
            <li flex="center">
              <div p="2" text="sm">
                <LoadingSvg />
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
